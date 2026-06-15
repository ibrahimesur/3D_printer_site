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

import asyncio
import logging
import os
import ssl
import ftplib
import re
import time
import json
from datetime import datetime
from pathlib import Path
from typing import Optional

import httpx
from paho.mqtt import client as mqtt

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

# ── Bambu Lab FTPS & MQTT Helpers ──────────────────────────────

class ImplicitFTP_TLS(ftplib.FTP_TLS):
    """Bambu Lab implicit FTPS (port 990) için SSL soket sarmalayıcı sınıf."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._sock = None

    @property
    def sock(self):
        return self._sock

    @sock.setter
    def sock(self, value):
        if value is not None and not isinstance(value, ssl.SSLSocket):
            value = self.context.wrap_socket(value)
        self._sock = value

def storbinary_patched(ftp, cmd, fp, blocksize=8192):
    """Bambu Lab FTPS sunucusundaki SSL unwrap kilitlenme sorununu çözen yama."""
    import time
    ftp.voidcmd('TYPE I')
    conn = ftp.transfercmd(cmd)
    try:
        while True:
            buf = fp.read(blocksize)
            if not buf:
                break
            conn.sendall(buf)
            # Yazıcının Wi-Fi/TCP stack'inin şişmesini ve bağlantıyı koparmasını (BrokenPipe)
            # önlemek için aktarım hızını ~800 KB/s ile sınırlandırıyoruz.
            time.sleep(0.01)
    finally:
        conn.close()
    return ftp.voidresp()

def _get_bambu_serial_from_configs(api_token: str) -> Optional[str]:
    """Bilgisayardaki BambuStudio veya OrcaSlicer konfigürasyonundan seri numarasını bulur."""
    home = os.path.expanduser("~")
    paths = [
        os.path.join(home, "Library/Application Support/BambuStudio/BambuStudio.conf"),
        os.path.join(home, "Library/Application Support/OrcaSlicer/OrcaSlicer.conf"),
        os.path.join(home, ".config/BambuStudio/BambuStudio.conf"),
        os.path.join(home, ".config/OrcaSlicer/OrcaSlicer.conf"),
        os.path.join(home, "AppData/Roaming/BambuStudio/BambuStudio.conf"),
        os.path.join(home, "AppData/Roaming/OrcaSlicer/OrcaSlicer.conf"),
    ]
    for p in paths:
        if os.path.exists(p):
            try:
                with open(p, "r") as f:
                    data = json.load(f)
                
                def find_key(d):
                    if isinstance(d, dict):
                        for k, v in d.items():
                            if v == api_token and len(k) >= 10:
                                return k
                            res = find_key(v)
                            if res:
                                return res
                    elif isinstance(d, list):
                        for item in d:
                            res = find_key(item)
                            if res:
                                return res
                    return None
                
                serial = find_key(data)
                if serial:
                    return serial
            except Exception:
                pass
    return None


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

    def _ftp_upload_sync(
        self,
        clean_ip: str,
        api_token: Optional[str],
        filename: str,
        gcode_path: str,
    ) -> None:
        """Bambu Lab yazıcısına G-code dosyasını FTPS ile senkron yükler (event loop'u engellememek için executor içinde çalışır)."""
        import ssl
        import ftplib

        context = ssl.create_default_context()
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE

        ftp = ImplicitFTP_TLS(context=context)
        # 300 saniye (5 dakika) timeout vererek büyük dosyaların kesilmesini önlüyoruz.
        ftp.connect(clean_ip, 990, timeout=300)
        ftp.login('bblp', api_token or "")
        ftp.prot_p()

        try:
            with open(gcode_path, "rb") as f:
                storbinary_patched(ftp, f"STOR /{filename}", f)
        finally:
            try:
                ftp.close()
            except Exception:
                pass

    # ── BambuLab Handler ─────────────────────────────────────────

    async def _stream_bambulab(
        self,
        client: httpx.AsyncClient,
        api_url: str,
        api_token: Optional[str],
        gcode_path: str,
    ) -> str:
        """
        BambuLab yazıcısına G-code dosyasını FTPS ile yükler ve MQTT ile baskıyı başlatır.
        """
        filename = Path(gcode_path).name
        
        # ── 1. Yazıcı profilini DB'den yükle (serial bulmak için) ──
        brand_model = ""
        db = SessionLocal()
        try:
            clean_ip = api_url.replace("http://", "").replace("https://", "").split(":")[0].split("/")[0]
            printer = db.query(PrinterProfile).filter(
                (PrinterProfile.api_url.contains(clean_ip)) & 
                (PrinterProfile.api_type == PrinterApiType.BAMBULAB.value)
            ).first()
            if printer:
                brand_model = printer.brand_model
        except Exception as e:
            logger.error(f"Yazıcı modeli sorgulanırken hata: {e}")
        finally:
            db.close()

        # ── 2. Seri numarasını belirle ───────────────────────────
        serial = None
        if brand_model:
            match = re.search(r'\b([0-9A-Z]{15})\b', brand_model)
            if match:
                serial = match.group(1)
                logger.info("Bambu Lab seri numarası model adından ayıklandı: %s", serial)

        if not serial and api_token:
            serial = _get_bambu_serial_from_configs(api_token)
            if serial:
                logger.info("Bambu Lab seri numarası yerel dilimleyici ayarlarından bulundu: %s", serial)

        if not serial:
            raise PrinterStartError(
                "Bambu Lab yazıcı seri numarası bulunamadı! "
                "Lütfen yazıcıyı kaydederken model adına seri numarasını ekleyin "
                "(Örn: 'Bambu Lab A1 03919D530110078') ya da bilgisayarınızda "
                "BambuStudio/OrcaSlicer üzerinden bu yazıcıya en az bir kere bağlanmış olun."
            )

        # ── 3. FTPS ile Dosya Yükle (Thread Pool'da çalıştırılır, event loop engellenmez) ──
        clean_ip = api_url.replace("http://", "").replace("https://", "").split(":")[0].split("/")[0]
        logger.info("Bambu Lab FTPS yükleme başlıyor: %s → %s:990", filename, clean_ip)
        
        try:
            import asyncio
            import ftplib
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                None,
                self._ftp_upload_sync,
                clean_ip,
                api_token,
                filename,
                gcode_path,
            )
            logger.info("Bambu Lab FTPS yükleme başarılı: %s", filename)
        except ftplib.all_errors as exc:
            raise PrinterUploadError(
                f"Bambu Lab FTPS dosya yükleme hatası: {exc}"
            )
        except Exception as exc:
            raise PrinterUploadError(
                f"Bambu Lab FTPS dosya yükleme sırasında beklenmeyen hata: {exc}"
            )

        # ── 4. MQTT ile Baskıyı Başlat ─────────────────────────────
        logger.info("Bambu Lab MQTT baskı başlatma komutu gönderiliyor: %s:8883", clean_ip)
        try:
            mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
            mqtt_client.username_pw_set("bblp", api_token)
            mqtt_client.tls_set(cert_reqs=ssl.CERT_NONE, tls_version=ssl.PROTOCOL_TLSv1_2)
            mqtt_client.tls_insecure_set(True)
            
            published = [False]
            
            def on_connect(c, userdata, flags, rc, properties=None):
                payload = {
                    "print": {
                        "sequence_id": str(int(time.time())),
                        "command": "gcode_file",
                        "param": filename
                    }
                }
                topic = f"device/{serial}/request"
                c.publish(topic, json.dumps(payload), qos=1)
                published[0] = True

            mqtt_client.on_connect = on_connect
            
            mqtt_client.connect(clean_ip, 8883, keepalive=60)
            
            start_time = time.time()
            while not published[0] and time.time() - start_time < 5:
                mqtt_client.loop(timeout=0.1)
                
            if not published[0]:
                raise PrinterStartError("MQTT broker'a bağlanılamadı veya komut gönderilemedi.")
                
            time.sleep(0.5)
            mqtt_client.disconnect()
            logger.info("Bambu Lab MQTT baskı başlatma başarılı: %s", filename)
        except Exception as exc:
            raise PrinterStartError(
                f"Bambu Lab MQTT baskı başlatma hatası: {exc}"
            )

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

    async def _monitor_bambulab_print(
        self,
        job_id: int,
        clean_ip: str,
        api_token: str,
    ) -> None:
        """Bambu Lab yazıcısından gelen MQTT durum raporlarını dinler ve veritabanını günceller."""
        logger.info("Bambu Lab canlı izleme başlatıldı (job #%d)", job_id)
        
        import ssl
        import json
        import time
        from paho.mqtt import client as mqtt
        
        # DB'den printer bilgilerini çekip serial'ı bul
        db = SessionLocal()
        brand_model = ""
        try:
            job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
            if job and job.printer:
                brand_model = job.printer.brand_model
        except Exception as e:
            logger.error("Bambu Lab monitor DB error fetching serial: %s", e)
        finally:
            db.close()

        import re
        serial = None
        if brand_model:
            match = re.search(r'\b([0-9A-Z]{15})\b', brand_model)
            if match:
                serial = match.group(1)
                
        if not serial:
            serial = _get_bambu_serial_from_configs(api_token)
            
        if not serial:
            logger.error("Bambu Lab monitor: Seri numarasi bulunamadigi icin izleme iptal edildi (job #%d)", job_id)
            return

        logger.info("Bambu Lab monitor serial resolved: %s for job #%d", serial, job_id)

        state = {
            "last_percentage": -1.0,
            "last_layer": -1,
            "last_total_layers": -1,
            "last_state": "",
            "last_message_time": time.time(),
            "finished": False,
        }

        def on_connect(client, userdata, flags, rc, properties=None):
            client.subscribe(f"device/{serial}/report")
            # Yazıcıdan anında durum raporu isteyelim (push_info)
            push_payload = json.dumps({
                "pushing": {
                    "sequence_id": str(int(time.time())),
                    "command": "pushall"
                }
            })
            client.publish(f"device/{serial}/request", push_payload, qos=1)
            logger.info("Bambu Lab monitor: pushall komutu gönderildi (job #%d)", job_id)

        def on_message(client, userdata, msg):
            state["last_message_time"] = time.time()
            try:
                data = json.loads(msg.payload.decode('utf-8', errors='ignore'))
                print_data = data.get("print")
                if not print_data:
                    return

                # Extract status changes
                gcode_state = print_data.get("gcode_state")
                mc_percent = print_data.get("mc_percent")
                layer_num = print_data.get("layer_num")
                total_layer_num = print_data.get("total_layer_num")
                
                # Check progress changes
                db_session = SessionLocal()
                try:
                    job = db_session.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
                    if job:
                        needs_commit = False
                        
                        # Update status based on gcode_state
                        if gcode_state and gcode_state != state["last_state"]:
                            state["last_state"] = gcode_state
                            if gcode_state in ("FINISH", "SUCCESS", "COMPLETED"):
                                job.status = PrintJobStatus.COMPLETED.value
                                job.ended_at = datetime.utcnow()
                                job.progress_percentage = 100.0
                                state["finished"] = True
                                needs_commit = True
                            elif gcode_state in ("FAILED", "ABORTED"):
                                job.status = PrintJobStatus.FAILED.value
                                job.ended_at = datetime.utcnow()
                                state["finished"] = True
                                needs_commit = True
                            elif gcode_state == "RUNNING" and job.status != PrintJobStatus.PRINTING.value:
                                job.status = PrintJobStatus.PRINTING.value
                                needs_commit = True
                                
                        # Update progress percent
                        if mc_percent is not None and mc_percent != state["last_percentage"]:
                            state["last_percentage"] = mc_percent
                            job.progress_percentage = float(mc_percent)
                            needs_commit = True

                        # Update current layer
                        if layer_num is not None and layer_num != state["last_layer"]:
                            state["last_layer"] = layer_num
                            job.current_layer = layer_num
                            needs_commit = True

                        # Update total layers
                        if total_layer_num is not None and total_layer_num != state["last_total_layers"]:
                            state["last_total_layers"] = total_layer_num
                            job.total_layers = total_layer_num
                            needs_commit = True

                        if needs_commit:
                            db_session.commit()
                            logger.info(
                                "Bambu Lab Job #%d: Status=%s, Progress=%d%%, Layer=%d/%d",
                                job_id, job.status, job.progress_percentage, job.current_layer, job.total_layers
                            )
                except Exception as db_err:
                    db_session.rollback()
                    logger.error("Bambu Lab monitor DB error (job #%d): %s", job_id, db_err)
                finally:
                    db_session.close()
            except Exception as e:
                logger.error("Bambu Lab monitor message parsing error: %s", e)

        # Connect MQTT client
        mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION2)
        mqtt_client.username_pw_set("bblp", api_token)
        mqtt_client.tls_set(cert_reqs=ssl.CERT_NONE, tls_version=ssl.PROTOCOL_TLSv1_2)
        mqtt_client.tls_insecure_set(True)
        mqtt_client.on_connect = on_connect
        mqtt_client.on_message = on_message

        connected_flag = [False]

        def on_disconnect(client, userdata, flags, rc, properties=None):
            logger.warning("Bambu Lab monitor MQTT disconnected (rc=%s, job #%d)", rc, job_id)

        def on_connect_wrapper(client, userdata, flags, rc, properties=None):
            connected_flag[0] = True
            on_connect(client, userdata, flags, rc, properties)

        mqtt_client.on_connect = on_connect_wrapper
        mqtt_client.on_disconnect = on_disconnect

        try:
            logger.info("Bambu Lab monitor: MQTT bağlantısı başlatılıyor (%s:8883, job #%d)", clean_ip, job_id)
            mqtt_client.connect(clean_ip, 8883, keepalive=30)
            mqtt_client.loop_start()

            # Bağlantının kurulmasını bekle (max 30 sn)
            connect_wait = time.time()
            while not connected_flag[0] and (time.time() - connect_wait < 30):
                await asyncio.sleep(1)

            if not connected_flag[0]:
                logger.error("Bambu Lab monitor: 30 sn içinde MQTT bağlantısı kurulamadı (job #%d). Yazıcı meşgul olabilir.", job_id)
                mqtt_client.loop_stop()
                try:
                    mqtt_client.disconnect()
                except Exception:
                    pass
                return

            logger.info("Bambu Lab monitor: MQTT bağlantısı kuruldu, dinleme başlıyor (job #%d)", job_id)
            
            # Monitor loop: check if print finished, or if connection timed out (no status messages for 15 minutes)
            # We wait up to 10 hours for a print job (36000 seconds)
            max_duration = 36000 
            start_monitor = time.time()
            
            while not state["finished"] and (time.time() - start_monitor < max_duration):
                # If we haven't received any message for 15 minutes, abort monitor
                if time.time() - state["last_message_time"] > 900:
                    logger.warning("Bambu Lab monitor: No messages received for 15 minutes. Aborting monitor for job #%d.", job_id)
                    break
                await asyncio.sleep(2)
                
            mqtt_client.loop_stop()
            mqtt_client.disconnect()
            logger.info("Bambu Lab canlı izleme sonlandırıldı (job #%d)", job_id)
        except Exception as e:
            logger.error("Bambu Lab monitor connection failed: %s", e)
            try:
                mqtt_client.loop_stop()
                mqtt_client.disconnect()
            except Exception:
                pass

    async def run_mock_simulation(self, job_id: int):
        import asyncio
        logger.info("Baskı simülasyonu başlatılıyor (job #%d)...", job_id)
        
        # STREAMING durumuna geç
        _update_job_status(job_id, PrintJobStatus.STREAMING, started_at=datetime.utcnow())
        await asyncio.sleep(2)
        
        # PRINTING durumuna geç ve katman katman ilerle
        _update_job_status(job_id, PrintJobStatus.PRINTING)
        total_layers = 100
        
        db = SessionLocal()
        try:
            job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
            if job:
                job.total_layers = total_layers
                db.commit()
        except Exception:
            db.rollback()
        finally:
            db.close()
            
        for layer in range(1, total_layers + 1):
            await asyncio.sleep(0.1) # 10 seconds total
            db = SessionLocal()
            try:
                job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
                if job:
                    job.current_layer = layer
                    job.progress_percentage = float(layer / total_layers * 100.0)
                    db.commit()
            except Exception:
                db.rollback()
            finally:
                db.close()
        
        # COMPLETED durumuna geç
        _update_job_status(job_id, PrintJobStatus.COMPLETED, ended_at=datetime.utcnow())
        logger.info("Mock baskı başarıyla tamamlandı (job #%d)", job_id)

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

        api_url = printer_data["api_url"] or ""
        api_type = printer_data["api_type"]
        brand = printer_data["brand_model"]

        logger.info(
            "Hedef yazıcı: %s (%s)  |  URL: %s",
            brand, api_type, api_url,
        )

        # Ensure scheme is prepended if missing and not empty/mock
        if api_url and not api_url.startswith(("http://", "https://")) and "mock-printer" not in api_url:
            api_url = f"http://{api_url}"

        # ── 1.5. Mock printer simulation check ────────────────────
        # Only simulate if URL is explicitly a mock-printer, empty, or dummy.
        # Do not simulate localhost or 127.0.0.1 because developers/users might run real printers locally.
        is_mock = not api_url or "mock-printer" in api_url or "demo-printer" in api_url
        if is_mock:
            await self.run_mock_simulation(job_id)
            return

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

        # ── 3. G-code dosya yolu doğrulama ve dinamik yeniden dilimleme ──
        if not gcode_path or not os.path.isfile(gcode_path):
            db = SessionLocal()
            try:
                job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
                if job:
                    if job.gcode_path and os.path.isfile(job.gcode_path):
                        gcode_path = job.gcode_path
                        logger.info("Veritabanından dilimlenmiş G-code dosyası yüklendi: %s", gcode_path)
                    else:
                        # G-code dosyası diskte yok (silinmiş veya ilk dilimleme başarısız olmuş).
                        # STL dosyasını Supabase'den tekrar indirip yeniden dilimlemeyi deniyoruz.
                        brand_model = job.printer.brand_model if job.printer else "bambulab_p1s"
                        order = job.order
                        if order and order.product and order.product.design_id:
                            from app.models.design import Design
                            design = db.query(Design).filter(Design.id == order.product.design_id).first()
                            if design and design.file_3d_urls:
                                files = json.loads(design.file_3d_urls) if isinstance(design.file_3d_urls, str) else design.file_3d_urls
                                stl_files = [f for f in files if f.endswith(".stl")]
                                if stl_files:
                                    filename_3d = stl_files[0]
                                    logger.info("G-code dosyası eksik. Dilimleme yeniden başlatılıyor. STL: %s", filename_3d)
                                    
                                    from app.core.supabase_utils import get_supabase_client
                                    from app.services.slicer import slicer_service
                                    import tempfile
                                    
                                    # Supabase'den STL indir
                                    supabase = get_supabase_client()
                                    file_data = supabase.storage.from_("product-stls").download(filename_3d)
                                    
                                    fd, temp_stl_path = tempfile.mkstemp(suffix=".stl", prefix=f"job_{job_id}_")
                                    os.close(fd)
                                    with open(temp_stl_path, "wb") as f:
                                        f.write(file_data)
                                    
                                    logger.info("Yeniden indirilen STL dilimleniyor: %s", temp_stl_path)
                                    # Dilimlemeyi çalıştır (yeni kurulan PrusaSlicer'ı kullanacak)
                                    gcode_path = await slicer_service.slice_stl(
                                        stl_file_path=temp_stl_path,
                                        printer_model=brand_model,
                                        infill_percentage=15,
                                        enable_supports=True,
                                        target_slot=1,
                                        job_id=job_id
                                    )
                                    
                                    job.gcode_path = gcode_path
                                    job.total_layers = slicer_service._estimate_layers(gcode_path)
                                    db.commit()
                                    logger.info("Dinamik yeniden dilimleme tamamlandı. G-code: %s", gcode_path)
            except Exception as e:
                logger.error("Dinamik dilimleme sırasında hata oluştu: %s", e)
            finally:
                db.close()

        if not gcode_path or not os.path.isfile(gcode_path):
            logger.error("G-code dosyası bulunamadı ve gerçek yazıcı için dinamik dilimleme başarısız oldu (job #%d).", job_id)
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())
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

            # ── 6.5. Canlı İzleme Görevini Başlat (Sadece Bambu Lab için) ──
            if api_type == PrinterApiType.BAMBULAB.value:
                clean_ip = api_url.replace("http://", "").replace("https://", "").split(":")[0].split("/")[0]
                import asyncio
                asyncio.create_task(
                    self._monitor_bambulab_print(
                        job_id=job_id,
                        clean_ip=clean_ip,
                        api_token=api_token,
                    )
                )

            logger.info(
                "═══ Akış tamamlandı  |  job=#%d  |  dosya=%s  |  yazıcı=%s ═══",
                job_id, filename, brand,
            )

        except PrinterAuthError as exc:
            logger.error(
                "Yazıcı kimlik doğrulama hatası (job #%d): %s", job_id, exc.message
            )
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())

        except PrinterConnectionError as exc:
            logger.error(
                "Yazıcı bağlantı hatası (job #%d): %s", job_id, exc.message
            )
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())

        except (PrinterUploadError, PrinterStartError) as exc:
            logger.error(
                "Yazıcı akış hatası (job #%d): %s", job_id, exc.message
            )
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())

        except httpx.ConnectError as exc:
            logger.error(
                "Yazıcıya bağlanılamadı (job #%d, url=%s): %s",
                job_id, api_url, exc,
            )
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())

        except httpx.TimeoutException as exc:
            logger.error(
                "Yazıcı bağlantısı zaman aşımına uğradı (job #%d): %s",
                job_id, exc,
            )
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())

        except Exception as exc:
            logger.exception(
                "Akış sırasında beklenmeyen hata (job #%d): %s", job_id, exc
            )
            _update_job_status(job_id, PrintJobStatus.FAILED, ended_at=datetime.utcnow())

        finally:
            # ── 7. G-code dosyasını güvenle sil ──────────────────
            if gcode_path:
                _secure_delete(gcode_path)


# ══════════════════════════════════════════════════════════════════
#  SINGLETON INSTANCE
# ══════════════════════════════════════════════════════════════════

stream_service = StreamService()
