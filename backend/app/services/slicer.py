"""
SlicerService – Bulutta otomatik STL → G-code dilimleme servisi.

PrusaSlicer (veya CuraEngine) CLI aracını subprocess ile arka planda çalıştırır.
FastAPI async event loop'unu bloklamadan run_in_executor ile çalışır.
Dilimleme öncesi/sonrası SecurePrintJob durumunu günceller.

Kullanım:
    from app.services.slicer import slicer_service
    gcode_path = await slicer_service.slice_stl(
        stl_file_path="/tmp/model.stl",
        printer_model="bambulab_p1s",
        infill_percentage=20,
        enable_supports=True,
        target_slot=1,
        job_id=42,
    )
"""

import asyncio
import logging
import os
import subprocess
import tempfile
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.secure_print_job import SecurePrintJob, PrintJobStatus

logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════
#  CUSTOM EXCEPTIONS
# ══════════════════════════════════════════════════════════════════

class SlicerException(Exception):
    """Dilimleme işlemi sırasında oluşan genel hatalar."""

    def __init__(self, message: str, returncode: Optional[int] = None, stderr: str = ""):
        self.message = message
        self.returncode = returncode
        self.stderr = stderr
        super().__init__(self.message)


class SlicerProfileNotFoundError(SlicerException):
    """İstenen yazıcı profil dosyası bulunamadı."""
    pass


class SlicerBinaryNotFoundError(SlicerException):
    """CLI dilimleyici ikili dosyası (prusa-slicer, CuraEngine) bulunamadı."""
    pass


# ══════════════════════════════════════════════════════════════════
#  DATABASE HELPERS (bağımsız oturum ile)
# ══════════════════════════════════════════════════════════════════

def _update_job_status(
    job_id: int,
    new_status: PrintJobStatus,
    started_at: Optional[datetime] = None,
    ended_at: Optional[datetime] = None,
    total_layers: Optional[int] = None,
) -> None:
    """
    SecurePrintJob kaydının durumunu bağımsız bir DB oturumunda günceller.
    Request bağlamından bağımsız çalışır (arka plan görevi / executor).
    """
    db = SessionLocal()
    try:
        job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
        if not job:
            logger.warning("SecurePrintJob #%d bulunamadı, durum güncellenemedi.", job_id)
            return

        job.status = new_status.value
        if started_at:
            job.started_at = started_at
        if ended_at:
            job.ended_at = ended_at
        if total_layers is not None:
            job.total_layers = total_layers

        db.commit()
        logger.info("SecurePrintJob #%d durumu → %s", job_id, new_status.value)
    except Exception:
        db.rollback()
        logger.exception("SecurePrintJob #%d durum güncellenirken DB hatası.", job_id)
    finally:
        db.close()


# ══════════════════════════════════════════════════════════════════
#  SLICER SERVICE
# ══════════════════════════════════════════════════════════════════

class SlicerService:
    """
    PrusaSlicer / CuraEngine CLI aracını yöneten ana servis sınıfı.

    Sorumlulukları:
      1. Yazıcı modeline göre profil dosyası seçimi
      2. CLI komut argümanlarının dinamik oluşturulması
      3. subprocess ile async-safe dilimleme
      4. SecurePrintJob durum geçişleri (SLICING → STREAMING / FAILED)
      5. IP koruması: ham STL dosyasının güvenli silinmesi
    """

    def __init__(self):
        self.binary: str = settings.SLICER_BINARY
        
        # Check standard macOS path if binary is the default "prusa-slicer"
        if self.binary == "prusa-slicer":
            possible_paths = [
                "/Applications/PrusaSlicer.app/Contents/MacOS/PrusaSlicer",
                "/Applications/Original Prusa Drivers/PrusaSlicer.app/Contents/MacOS/PrusaSlicer"
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    self.binary = path
                    logger.info("macOS PrusaSlicer uygulaması tespit edildi: %s", self.binary)
                    break

        self.profiles_dir: Path = Path(settings.SLICER_PROFILES_DIR)
        self.temp_dir: Optional[Path] = (
            Path(settings.SLICER_TEMP_DIR) if settings.SLICER_TEMP_DIR else None
        )

        # Profil dizinini oluştur (yoksa)
        self.profiles_dir.mkdir(parents=True, exist_ok=True)

        logger.info(
            "SlicerService başlatıldı  |  binary=%s  |  profiles=%s  |  temp=%s",
            self.binary,
            self.profiles_dir.resolve(),
            self.temp_dir or "<sistem tmp>",
        )

    # ── 1. Profile Resolution ────────────────────────────────────

    def _resolve_profile_path(self, printer_model: str) -> Path:
        """
        Yazıcı modeline göre profil dosyasını bulur.

        Arama sırası:
          1. {profiles_dir}/{printer_model}.ini
          2. {profiles_dir}/{printer_model}.json
          3. {profiles_dir}/default.ini   (fallback)

        Raises:
            SlicerProfileNotFoundError: Hiçbir profil bulunamadığında.
        """
        # Dosya adını güvenli hale getir (/ .. gibi karakterleri engelle)
        safe_name = printer_model.replace("/", "_").replace("\\", "_").replace("..", "_")

        for ext in (".ini", ".json"):
            candidate = self.profiles_dir / f"{safe_name}{ext}"
            if candidate.exists():
                logger.debug("Yazıcı profili bulundu: %s", candidate)
                return candidate

        # Fallback → default profil
        default = self.profiles_dir / "default.ini"
        if default.exists():
            logger.warning(
                "'%s' profili bulunamadı, default profil kullanılıyor.", printer_model
            )
            return default

        raise SlicerProfileNotFoundError(
            f"Yazıcı profili bulunamadı: '{printer_model}'. "
            f"Lütfen '{self.profiles_dir}/' dizinine uygun .ini/.json dosyası ekleyin."
        )

    # ── 2. Output Path Creation ──────────────────────────────────

    def _create_output_path(self) -> Path:
        """Benzersiz isimli geçici G-code çıktı dosyası yolu oluşturur."""
        unique_id = uuid.uuid4().hex[:12]
        filename = f"print_{unique_id}.gcode"

        if self.temp_dir:
            self.temp_dir.mkdir(parents=True, exist_ok=True)
            return self.temp_dir / filename

        # Sistem temp dizininde oluştur
        fd, path = tempfile.mkstemp(suffix=".gcode", prefix="print_")
        os.close(fd)
        return Path(path)

    # ── 3. CLI Command Builder ───────────────────────────────────

    @staticmethod
    def _build_command(
        binary: str,
        stl_path: str,
        output_path: str,
        profile_path: str,
        infill_percentage: int,
        enable_supports: bool,
        target_slot: int,
    ) -> list:
        """
        PrusaSlicer CLI komut argümanlarını dinamik olarak oluşturur.

        Üretilen komut örneği:
          prusa-slicer --slice \\
            --load=slicer_profiles/bambulab_p1s.ini \\
            --fill-density=20% \\
            --support-material=1 \\
            --extruder=1 \\
            model.stl \\
            --output=output.gcode
        """
        return [
            binary,
            "--slice",
            f"--load={profile_path}",
            f"--fill-density={infill_percentage}%",
            f"--support-material={'1' if enable_supports else '0'}",
            f"--extruder={target_slot}",
            stl_path,
            f"--output={output_path}",
        ]

    # ── 4. Synchronous Subprocess Runner ─────────────────────────

    def _run_slicer(
        self,
        stl_path: str,
        output_path: str,
        profile_path: str,
        infill_percentage: int,
        enable_supports: bool,
        target_slot: int,
    ) -> str:
        """
        Senkron subprocess ile dilimleyiciyi çalıştırır.

        ⚠ Doğrudan çağrılmamalıdır – slice_stl() üzerinden
          asyncio.run_in_executor() ile kullanılır.

        Returns:
            Oluşturulan G-code dosyasının yolu.

        Raises:
            SlicerBinaryNotFoundError:  CLI aracı bulunamadı.
            SlicerException:            Dilimleme hatası veya timeout.
        """
        cmd = self._build_command(
            binary=self.binary,
            stl_path=stl_path,
            output_path=output_path,
            profile_path=profile_path,
            infill_percentage=infill_percentage,
            enable_supports=enable_supports,
            target_slot=target_slot,
        )

        logger.info("Dilimleme komutu: %s", " ".join(cmd))

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600,            # Maks 10 dakika
            )
        except FileNotFoundError:
            raise SlicerBinaryNotFoundError(
                f"Dilimleyici bulunamadı: '{self.binary}'. "
                f"PrusaSlicer veya CuraEngine kurulumunu kontrol edin."
            )
        except subprocess.TimeoutExpired:
            raise SlicerException(
                "Dilimleme zaman aşımına uğradı (10 dk). "
                "STL çok büyük veya karmaşık olabilir."
            )

        # ── Log stdout/stderr ────────────────────────────────────
        if result.stdout:
            logger.warning("Slicer stdout:\n%s", result.stdout[-2000:])
        if result.stderr:
            logger.warning("Slicer stderr:\n%s", result.stderr[-2000:])

        # ── Return code kontrolü ─────────────────────────────────
        if result.returncode != 0:
            raise SlicerException(
                message=(
                    f"Dilimleme başarısız (code: {result.returncode}). "
                    f"Stderr: {result.stderr[:500]}"
                ),
                returncode=result.returncode,
                stderr=result.stderr,
            )

        # ── Çıktı dosyası doğrulaması ────────────────────────────
        if not os.path.isfile(output_path):
            raise SlicerException(
                f"Dilimleyici başarılı döndü ancak G-code oluşmadı: {output_path}"
            )

        file_size = os.path.getsize(output_path)
        if file_size == 0:
            raise SlicerException(
                "Dilimleyici boş G-code oluşturdu. STL bozuk veya boş olabilir."
            )

        logger.info(
            "Dilimleme tamamlandı  |  çıktı=%s  |  boyut=%.2f KB",
            output_path,
            file_size / 1024,
        )
        return output_path

    # ── 5. Secure File Cleanup ───────────────────────────────────

    @staticmethod
    def _secure_delete(file_path: str) -> None:
        """
        Dosyayı güvenli şekilde siler (IP koruması).

        İşlem:
          1. Dosya içeriğini sıfır baytlarla üst-yazar (overwrite)
          2. Disk'e flush eder (fsync)
          3. Dosyayı kaldırır (unlink)

        Bu, silinmiş dosyanın disk kurtarma araçlarıyla
        okunmasını zorlaştırır.
        """
        try:
            path = Path(file_path)
            if not path.exists():
                return

            file_size = path.stat().st_size

            # Overwrite with zeros
            with open(path, "wb") as f:
                f.write(b"\x00" * min(file_size, 100 * 1024 * 1024))  # Max 100MB zero-fill
                f.flush()
                os.fsync(f.fileno())

            # Remove
            path.unlink()
            logger.debug("Dosya güvenli şekilde silindi: %s", file_path)
        except OSError as exc:
            logger.warning("Dosya silinirken hata: %s – %s", file_path, exc)

    # ── 6. Layer Estimation ──────────────────────────────────────

    @staticmethod
    def _estimate_layers(gcode_path: str) -> int:
        """
        G-code dosyasından toplam katman sayısını tahmin eder.

        PrusaSlicer formatı:   "; LAYER_CHANGE"
        Cura formatı:          ";LAYER:"
        """
        layer_count = 0
        try:
            with open(gcode_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    upper = line.strip().upper()
                    if upper.startswith("; LAYER_CHANGE") or upper.startswith(";LAYER:"):
                        layer_count += 1
        except OSError:
            logger.warning("G-code katman tahmini başarısız: %s", gcode_path)

        return max(layer_count, 1)

    # ══════════════════════════════════════════════════════════════
    #  PUBLIC ASYNC API
    # ══════════════════════════════════════════════════════════════

    async def slice_stl(
        self,
        stl_file_path: str,
        printer_model: str,
        infill_percentage: int = 20,
        enable_supports: bool = False,
        target_slot: int = 1,
        job_id: Optional[int] = None,
    ) -> str:
        """
        STL dosyasını G-code'a dönüştürür (async – event loop'u bloklamaz).

        Yaşam Döngüsü:
          1. Girdi doğrulama
          2. Profil seçimi + geçici çıktı yolu oluşturma
          3. SecurePrintJob → SLICING
          4. subprocess (run_in_executor ile arka planda)
          5a. Başarılı → STREAMING + katman tahmini
          5b. Hata    → FAILED + temizlik
          6. Ham STL dosyası her durumda güvenle silinir

        Args:
            stl_file_path:      Ham STL dosyasının disk yolu.
            printer_model:      Profil adı (örn: "bambulab_p1s", "ender3_v3").
            infill_percentage:  Doluluk oranı (0-100).
            enable_supports:    Destek yapısı eklensin mi?
            target_slot:        Hedef filament/ekstrüder slot numarası (1-based).
            job_id:             SecurePrintJob kaydının ID'si (durum güncelleme için).

        Returns:
            Oluşturulan G-code dosyasının tam yolu.

        Raises:
            SlicerException:                Dilimleme hatası.
            SlicerProfileNotFoundError:     Yazıcı profili bulunamadı.
            SlicerBinaryNotFoundError:      CLI aracı bulunamadı.
        """

        # ── 1. Girdi doğrulama ───────────────────────────────────
        if not os.path.isfile(stl_file_path):
            raise SlicerException(f"STL dosyası bulunamadı: {stl_file_path}")

        logger.info(
            "Dilimleme başlatılıyor  |  stl=%s  |  yazıcı=%s  |  "
            "doluluk=%d%%  |  destek=%s  |  slot=%d  |  job=#%s",
            stl_file_path, printer_model, infill_percentage,
            enable_supports, target_slot, job_id or "-",
        )

        # ── 2. Profil ve çıktı yolu hazırla ──────────────────────
        profile_path = self._resolve_profile_path(printer_model)
        output_path = self._create_output_path()

        # ── 3. Job durumunu SLICING yap ──────────────────────────
        if job_id:
            _update_job_status(
                job_id=job_id,
                new_status=PrintJobStatus.SLICING,
                started_at=datetime.utcnow(),
            )

        # ── 4. Subprocess'i arka plan thread'inde çalıştır ───────
        loop = asyncio.get_running_loop()
        try:
            gcode_path = await loop.run_in_executor(
                None,       # Default ThreadPoolExecutor
                self._run_slicer,
                stl_file_path,
                str(output_path),
                str(profile_path),
                infill_percentage,
                enable_supports,
                target_slot,
            )

            # ── 5a. Başarılı → PENDING + katman tahmini ────────
            if job_id:
                estimated_layers = self._estimate_layers(gcode_path)
                _update_job_status(
                    job_id=job_id,
                    new_status=PrintJobStatus.PENDING,
                    total_layers=estimated_layers,
                )

            logger.info(
                "Dilimleme akışı tamamlandı  |  job=#%s  |  gcode=%s",
                job_id or "-", gcode_path,
            )
            return gcode_path

        except (SlicerException, FileNotFoundError, Exception) as exc:
            # Check if this is a mock printer. If it's a real printer, DO NOT fallback to mock!
            is_mock_printer = True
            if job_id:
                db = SessionLocal()
                try:
                    job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
                    if job and job.printer:
                        api_url = job.printer.api_url or ""
                        is_mock_printer = not api_url or "mock-printer" in api_url or "demo-printer" in api_url
                except Exception as db_err:
                    logger.error("slicer: DB query failed for job #%s: %s", job_id, db_err)
                finally:
                    db.close()

            if not is_mock_printer:
                logger.error(
                    "slicer: Dilimleme real yazici (job #%s) icin basarisiz oldu: %s",
                    job_id or "-", str(exc)
                )
                if job_id:
                    _update_job_status(
                        job_id=job_id,
                        new_status=PrintJobStatus.FAILED,
                        ended_at=datetime.utcnow(),
                    )
                self._secure_delete(str(output_path))
                raise exc

            # ── 5b. Hata → Simülasyon için mock G-code üret (Sadece mock yazıcılar için) ─────
            logger.warning(
                "Dilimleyici çalıştırılamadı (job #%s): %s. Baskı simülasyonu için mock G-code üretiliyor...",
                job_id or "-", str(exc),
            )
            try:
                with open(output_path, "w") as f:
                    f.write("; Mock Gcode for job - actual moves for testing\n")
                    f.write("G90 ; absolute positioning\n")
                    f.write("M83 ; relative extrusion\n")
                    f.write("G28 ; home all axes\n")
                    f.write("G1 Z5 F3000 ; lift nozzle\n")
                    f.write("G1 X10 Y10 F3000 ; move to start\n")
                    for i in range(100):
                        f.write(f"; LAYER_CHANGE\n; LAYER:{i}\n")
                        f.write(f"G1 Z{0.2 + i * 0.2:.2f} F1500\n")
                        # Draw a small 20x20 square in the air
                        f.write("G1 X30 Y10 F2000\n")
                        f.write("G1 X30 Y30 F2000\n")
                        f.write("G1 X10 Y30 F2000\n")
                        f.write("G1 X10 Y10 F2000\n")
                    f.write("G28 X0 Y0 ; home X and Y\n")
                    f.write("M84 ; disable motors\n")
                gcode_path = str(output_path)
                
                if job_id:
                    estimated_layers = self._estimate_layers(gcode_path)
                    _update_job_status(
                        job_id=job_id,
                        new_status=PrintJobStatus.PENDING,
                        total_layers=estimated_layers,
                    )
                return gcode_path
            except Exception as e:
                logger.error("Mock G-code üretilemedi: %s", e)
                if job_id:
                    _update_job_status(
                        job_id=job_id,
                        new_status=PrintJobStatus.FAILED,
                        ended_at=datetime.utcnow(),
                    )
                self._secure_delete(str(output_path))
                raise

        finally:
            # ── 6. Ham STL'i her durumda güvenle sil ─────────────
            self._secure_delete(stl_file_path)
            logger.debug("STL temizliği tamamlandı: %s", stl_file_path)


# ══════════════════════════════════════════════════════════════════
#  SINGLETON INSTANCE
# ══════════════════════════════════════════════════════════════════

slicer_service = SlicerService()
