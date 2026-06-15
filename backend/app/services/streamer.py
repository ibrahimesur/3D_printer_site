"""
StreamService – G-code dosyasını yazıcıya güvenli HTTP akışı ile aktarır.

Desteklenen yazıcı API'leri:
  - Klipper / Moonraker  → POST /server/files/upload + POST /printer/print/start
  - OctoPrint             → POST /api/files/local (select & print)
  - BambuLab              → POST /api/files/upload  (basitleştirilmiş)

Kullanım:
    from app.services.streamer import stream_service
    await stream_service.stream_to_printer(job_id=42)
"""

import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx

from app.core.encryption import decrypt_token
from app.db.session import SessionLocal
from app.models.printer_profile import PrinterProfile, PrinterApiType
from app.models.secure_print_job import SecurePrintJob, PrintJobStatus

logger = logging.getLogger(__name__)

# ── Sabitler ─────────────────────────────────────────────────────

UPLOAD_TIMEOUT = 300.0          # Dosya yükleme timeout (5 dk)
COMMAND_TIMEOUT = 30.0          # Komut gönderme timeout (30 sn)
CHUNK_SIZE = 64 * 1024          # 64 KB okuma parçası


# ══════════════════════════════════════════════════════════════════
#  CUSTOM EXCEPTIONS
# ══════════════════════════════════════════════════════════════════

class StreamException(Exception):
    """G-code akış işlemi sırasında oluşan genel hatalar."""

    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class PrinterConnectionError(StreamException):
    """Yazıcı API'sine bağlantı kurulamadı (timeout, DNS, refused)."""
    pass


class PrinterAuthError(StreamException):
    """Yazıcı API'si geçersiz token/anahtar nedeniyle erişimi reddetti."""
    pass


class PrinterUploadError(StreamException):
    """G-code dosyası yazıcıya yüklenirken hata oluştu."""
    pass


class PrinterStartError(StreamException):
    """Baskı başlatma komutu yazıcı tarafından reddedildi."""
    pass


# ══════════════════════════════════════════════════════════════════
#  DATABASE HELPERS
# ══════════════════════════════════════════════════════════════════

def _update_job_status(
    job_id: int,
    new_status: PrintJobStatus,
    started_at: Optional[datetime] = None,
    ended_at: Optional[datetime] = None,
) -> None:
    """SecurePrintJob durumunu bağımsız DB oturumunda günceller."""
    db = SessionLocal()
    try:
        job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
        if not job:
            logger.warning("SecurePrintJob #%d bulunamadı.", job_id)
            return

        job.status = new_status.value
        if started_at:
            job.started_at = started_at
        if ended_at:
            job.ended_at = ended_at

        db.commit()
        logger.info("SecurePrintJob #%d durumu → %s", job_id, new_status.value)
    except Exception:
        db.rollback()
        logger.exception("SecurePrintJob #%d DB güncelleme hatası.", job_id)
    finally:
        db.close()


def _load_job_and_printer(job_id: int) -> tuple:
    """
    Job ve ilişkili PrinterProfile'ı veritabanından çeker.

    Returns:
        (SecurePrintJob, PrinterProfile) tuple'ı.

    Raises:
        StreamException: Job veya yazıcı bulunamadığında.
    """
    db = SessionLocal()
    try:
        job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
        if not job:
            raise StreamException(f"SecurePrintJob #{job_id} bulunamadı.")

        printer = db.query(PrinterProfile).filter(
            PrinterProfile.id == job.printer_id
        ).first()
        if not printer:
            raise StreamException(
                f"PrinterProfile #{job.printer_id} bulunamadı (job #{job_id})."
            )
        if not printer.is_active:
            raise StreamException(
                f"Yazıcı pasif durumda: {printer.brand_model} (#{printer.id})."
            )

        # İlişkileri kaybetmemek için değerleri çıkart
        job_data = {
            "id": job.id,
            "order_id": job.order_id,
            "printer_id": job.printer_id,
            "status": job.status,
        }
        printer_data = {
            "id": printer.id,
            "user_id": printer.user_id,
            "brand_model": printer.brand_model,
            "api_type": printer.api_type,
            "api_url": printer.api_url.rstrip("/"),
            "api_token_encrypted": printer.api_token_encrypted,
        }
        return job_data, printer_data
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════════
#  SECURE FILE CLEANUP (slicer.py ile aynı mantık)
# ══════════════════════════════════════════════════════════════════

def _secure_delete(file_path: str) -> None:
    """Dosyayı güvenli şekilde siler (overwrite + unlink)."""
    try:
        path = Path(file_path)
        if not path.exists():
            return
        file_size = path.stat().st_size
        with open(path, "wb") as f:
            f.write(b"\x00" * min(file_size, 100 * 1024 * 1024))
            f.flush()
            os.fsync(f.fileno())
        path.unlink()
        logger.debug("G-code güvenli şekilde silindi: %s", file_path)
    except OSError as exc:
        logger.warning("G-code silinirken hata: %s – %s", file_path, exc)


# ══════════════════════════════════════════════════════════════════
#  STREAM SERVICE
# ══════════════════════════════════════════════════════════════════

class StreamService:
    """
    G-code dosyasını yazıcı API'sine HTTP ile aktaran servis.

    Yaşam Döngüsü:
      1. Job + Printer verilerini DB'den çek
      2. API token'ı decrypt et
      3. Job → STREAMING
      4. api_type'a göre uygun handler'ı seç
      5. G-code'u multipart/form-data ile yükle
      6. Baskıyı Başlat komutu gönder
      7. Job → PRINTING
      8. G-code dosyasını güvenle sil

    Hata durumunda:
      - Job → FAILED + hata loglanır
    """

    # ── Klipper / Moonraker Handler ──────────────────────────────

    async def _stream_moonraker(
        self,
        client: httpx.AsyncClient,
        api_url: str,
        api_token: Optional[str],
        gcode_path: str,
    ) -> str:
        """
        Moonraker (Klipper) API'sine G-code yükler ve baskıyı başlatır.

        Akış:
          1. POST /server/files/upload  (multipart dosya yükleme)
          2. POST /printer/print/start?filename=...
        """
        filename = Path(gcode_path).name
        headers = {}
        if api_token:
            headers["Authorization"] = f"Bearer {api_token}"

        # ── 1. Dosya yükleme ─────────────────────────────────────
        logger.info("Moonraker yükleme başlıyor: %s → %s", filename, api_url)

        with open(gcode_path, "rb") as f:
            files = {"file": (filename, f, "application/octet-stream")}
            response = await client.post(
                f"{api_url}/server/files/upload",
                files=files,
                headers=headers,
                timeout=UPLOAD_TIMEOUT,
            )

        if response.status_code == 401:
            raise PrinterAuthError(
                "Moonraker API token geçersiz veya süresi dolmuş.",
                status_code=401,
            )
        if response.status_code not in (200, 201):
            raise PrinterUploadError(
                f"Moonraker dosya yükleme hatası: HTTP {response.status_code} – "
                f"{response.text[:300]}",
                status_code=response.status_code,
            )

        logger.info("Moonraker yükleme başarılı: %s", filename)

        # ── 2. Baskıyı başlat ────────────────────────────────────
        start_response = await client.post(
            f"{api_url}/printer/print/start",
            params={"filename": filename},
            headers=headers,
            timeout=COMMAND_TIMEOUT,
        )

        if start_response.status_code not in (200, 201):
            raise PrinterStartError(
                f"Moonraker baskı başlatma hatası: HTTP {start_response.status_code} – "
                f"{start_response.text[:300]}",
                status_code=start_response.status_code,
            )

        logger.info("Moonraker baskı başlatıldı: %s", filename)
        return filename

    # ── OctoPrint Handler ────────────────────────────────────────

    async def _stream_octoprint(
        self,
        client: httpx.AsyncClient,
        api_url: str,
        api_token: Optional[str],
        gcode_path: str,
    ) -> str:
        """
        OctoPrint API'sine G-code yükler ve baskıyı başlatır.

        Tek istek: POST /api/files/local
          - select=true & print=true ile dosya yükleme + baskı aynı anda.
        """
        filename = Path(gcode_path).name
        headers = {}
        if api_token:
            headers["X-Api-Key"] = api_token

        logger.info("OctoPrint yükleme başlıyor: %s → %s", filename, api_url)

        with open(gcode_path, "rb") as f:
            files = {"file": (filename, f, "application/octet-stream")}
            data = {"select": "true", "print": "true"}

            response = await client.post(
                f"{api_url}/api/files/local",
                files=files,
                data=data,
                headers=headers,
                timeout=UPLOAD_TIMEOUT,
            )

        if response.status_code == 401:
            raise PrinterAuthError(
                "OctoPrint API key geçersiz veya süresi dolmuş.",
                status_code=401,
            )
        if response.status_code == 409:
            raise PrinterStartError(
                "OctoPrint yazıcı şu an meşgul (409 Conflict). "
                "Devam eden bir baskı olabilir.",
                status_code=409,
            )
        if response.status_code not in (200, 201):
            raise PrinterUploadError(
                f"OctoPrint yükleme hatası: HTTP {response.status_code} – "
                f"{response.text[:300]}",
                status_code=response.status_code,
            )

        logger.info("OctoPrint yükleme + baskı başlatma başarılı: %s", filename)
        return filename

    # ── BambuLab Handler ─────────────────────────────────────────

    async def _stream_bambulab(
        self,
        client: httpx.AsyncClient,
        api_url: str,
        api_token: Optional[str],
        gcode_path: str,
    ) -> str:
        """
        BambuLab API'sine G-code yükler ve baskıyı başlatır.

        Not: BambuLab bulut API'si farklı çalışabilir – bu temel implementasyon
        yerel LAN modu (MQTT/HTTP hybrid) için hazırlanmıştır.
        """
        filename = Path(gcode_path).name
        headers = {}
        if api_token:
            headers["Authorization"] = f"Bearer {api_token}"

        logger.info("BambuLab yükleme başlıyor: %s → %s", filename, api_url)

        # ── Dosya yükleme ────────────────────────────────────────
        with open(gcode_path, "rb") as f:
            files = {"file": (filename, f, "application/octet-stream")}
            response = await client.post(
                f"{api_url}/api/files/upload",
                files=files,
                headers=headers,
                timeout=UPLOAD_TIMEOUT,
            )

        if response.status_code == 401:
            raise PrinterAuthError(
                "BambuLab API erişim anahtarı geçersiz.",
                status_code=401,
            )
        if response.status_code not in (200, 201):
            raise PrinterUploadError(
                f"BambuLab yükleme hatası: HTTP {response.status_code} – "
                f"{response.text[:300]}",
                status_code=response.status_code,
            )

        # ── Baskıyı başlat ───────────────────────────────────────
        start_response = await client.post(
            f"{api_url}/api/print/start",
            json={"filename": filename},
            headers=headers,
            timeout=COMMAND_TIMEOUT,
        )

        if start_response.status_code not in (200, 201):
            raise PrinterStartError(
                f"BambuLab baskı başlatma hatası: HTTP {start_response.status_code} – "
                f"{start_response.text[:300]}",
                status_code=start_response.status_code,
            )

        logger.info("BambuLab baskı başlatıldı: %s", filename)
        return filename

    # ── Handler Dispatcher ───────────────────────────────────────

    def _get_handler(self, api_type: str):
        """api_type'a göre uygun akış handler'ını döndürür."""
        handlers = {
            PrinterApiType.KLIPPER.value: self._stream_moonraker,
            PrinterApiType.OCTOPRINT.value: self._stream_octoprint,
            PrinterApiType.BAMBULAB.value: self._stream_bambulab,
        }
        handler = handlers.get(api_type)
        if not handler:
            raise StreamException(
                f"Desteklenmeyen yazıcı API türü: '{api_type}'. "
                f"Desteklenen: {', '.join(handlers.keys())}"
            )
        return handler

    # ══════════════════════════════════════════════════════════════
    #  PUBLIC ASYNC API
    # ══════════════════════════════════════════════════════════════

    async def stream_to_printer(
        self,
        job_id: int,
        gcode_path: Optional[str] = None,
    ) -> None:
        """
        G-code dosyasını yazıcıya HTTP akışı ile aktarır ve baskıyı başlatır.

        Bu metod FastAPI BackgroundTasks içinden çağrılmak üzere tasarlanmıştır.

        Yaşam Döngüsü:
          1. DB'den job + printer verilerini çek
          2. Şifreli API token'ı decrypt et
          3. Job → STREAMING
          4. api_type'a göre handler seç ve çalıştır
             a. G-code'u multipart upload et
             b. Baskıyı başlat komutu gönder
          5. Job → PRINTING
          6. G-code dosyasını güvenle sil (IP koruması)

        Args:
            job_id:     SecurePrintJob kaydının ID'si.
            gcode_path: G-code dosya yolu (None ise DB'den veya convention ile bulunur).
        """
        logger.info("═══ Akış başlatılıyor  |  job=#%d ═══", job_id)

        # ── 1. Job + Printer verilerini çek ──────────────────────
        try:
            job_data, printer_data = _load_job_and_printer(job_id)
        except StreamException as exc:
            logger.error("Akış verileri yüklenemedi: %s", exc.message)
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())
            return

        api_url = printer_data["api_url"]
        api_type = printer_data["api_type"]
        brand = printer_data["brand_model"]

        logger.info(
            "Hedef yazıcı: %s (%s)  |  URL: %s",
            brand, api_type, api_url,
        )

        # ── 2. API token'ı decrypt et ────────────────────────────
        api_token: Optional[str] = None
        if printer_data["api_token_encrypted"]:
            try:
                api_token = decrypt_token(printer_data["api_token_encrypted"])
                logger.debug("API token başarıyla çözüldü (job #%d).", job_id)
            except Exception:
                logger.exception("API token decrypt hatası (job #%d).", job_id)
                _update_job_status(
                    job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
                )
                return

        # ── 3. G-code dosya yolu doğrulama ───────────────────────
        if not gcode_path or not os.path.isfile(gcode_path):
            logger.error(
                "G-code dosyası bulunamadı: %s (job #%d)",
                gcode_path, job_id,
            )
            _update_job_status(
                job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
            )
            return

        # ── 4. Job → STREAMING ───────────────────────────────────
        _update_job_status(
            job_id, PrintJobStatus.STREAMING, started_at=datetime.utcnow()
        )

        # ── 5. Handler'ı seç ve çalıştır ─────────────────────────
        try:
            handler = self._get_handler(api_type)

            async with httpx.AsyncClient(
                verify=False,       # Yerel ağ yazıcıları genelde self-signed cert kullanır
                follow_redirects=True,
            ) as client:
                filename = await handler(
                    client=client,
                    api_url=api_url,
                    api_token=api_token,
                    gcode_path=gcode_path,
                )

            # ── 6. Başarılı → PRINTING ───────────────────────────
            _update_job_status(job_id, PrintJobStatus.PRINTING)

            logger.info(
                "═══ Akış tamamlandı  |  job=#%d  |  dosya=%s  |  yazıcı=%s ═══",
                job_id, filename, brand,
            )

        except PrinterAuthError as exc:
            logger.error(
                "Yazıcı kimlik doğrulama hatası (job #%d): %s", job_id, exc.message
            )
            _update_job_status(
                job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
            )

        except PrinterConnectionError as exc:
            logger.error(
                "Yazıcı bağlantı hatası (job #%d): %s", job_id, exc.message
            )
            _update_job_status(
                job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
            )

        except (PrinterUploadError, PrinterStartError) as exc:
            logger.error(
                "Yazıcı akış hatası (job #%d): %s", job_id, exc.message
            )
            _update_job_status(
                job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
            )

        except httpx.ConnectError as exc:
            logger.error(
                "Yazıcıya bağlanılamadı (job #%d, url=%s): %s",
                job_id, api_url, exc,
            )
            _update_job_status(
                job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
            )

        except httpx.TimeoutException as exc:
            logger.error(
                "Yazıcı bağlantısı zaman aşımına uğradı (job #%d): %s",
                job_id, exc,
            )
            _update_job_status(
                job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
            )

        except Exception as exc:
            logger.exception(
                "Akış sırasında beklenmeyen hata (job #%d): %s", job_id, exc
            )
            _update_job_status(
                job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow()
            )

        finally:
            # ── 7. G-code dosyasını güvenle sil ──────────────────
            if gcode_path:
                _secure_delete(gcode_path)


# ══════════════════════════════════════════════════════════════════
#  SINGLETON INSTANCE
# ══════════════════════════════════════════════════════════════════

stream_service = StreamService()
