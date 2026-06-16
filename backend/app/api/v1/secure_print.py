"""
Güvenli Baskı Akışı Router'ı – Üreticinin baskıyı başlatması ve takip etmesi.

Endpoint'ler:
  POST /producer/jobs/{job_id}/start   →  Arka planda akışı başlat (202 Accepted)
  GET  /producer/jobs/{job_id}/status  →  Anlık baskı durumu
"""

from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.printer_profile import PrinterProfile
from app.models.secure_print_job import SecurePrintJob, PrintJobStatus
from app.services.streamer import stream_service

router = APIRouter(prefix="/producer/jobs", tags=["Secure Print Jobs"])


# ── Helpers ───────────────────────────────────────────────────────

def _require_producer(user: User) -> None:
    """Yalnızca üretici veya admin rolündeki kullanıcıları geçirir."""
    if user.role not in (UserRole.PRODUCER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem yalnızca üreticiler için geçerlidir.",
        )


def _verify_job_ownership(
    job_id: int,
    user: User,
    db: Session,
) -> SecurePrintJob:
    """
    Job'un var olduğunu ve çağıran üreticiye ait yazıcıda olduğunu doğrular.

    Returns:
        SecurePrintJob kaydı.

    Raises:
        HTTPException: Job bulunamazsa veya yetki yoksa.
    """
    job = db.query(SecurePrintJob).filter(SecurePrintJob.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Baskı görevi bulunamadı: #{job_id}",
        )

    # Yazıcının bu kullanıcıya ait olduğunu kontrol et
    printer = db.query(PrinterProfile).filter(
        PrinterProfile.id == job.printer_id
    ).first()

    if not printer or printer.user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu baskı görevi size ait bir yazıcıda değil.",
        )

    return job


# ── Pydantic Schemas ─────────────────────────────────────────────

class StartPrintRequest(BaseModel):
    """Baskı başlatma isteği (opsiyonel G-code yolu)."""
    gcode_path: Optional[str] = None


class StartPrintResponse(BaseModel):
    """Baskı başlatma yanıtı."""
    message: str
    job_id: int
    status: str


class JobStatusResponse(BaseModel):
    """Baskı görevi anlık durum yanıtı."""
    id: int
    order_id: int
    printer_id: int
    printer_name: Optional[str] = None
    status: str
    current_layer: int
    total_layers: int
    progress_percentage: float
    started_at: Optional[str] = None
    ended_at: Optional[str] = None
    created_at: Optional[str] = None


# ══════════════════════════════════════════════════════════════════
#  ENDPOINTS
# ══════════════════════════════════════════════════════════════════

@router.post(
    "/{job_id}/start",
    response_model=StartPrintResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Baskıyı Başlat",
)
async def start_print_job(
    job_id: int,
    payload: StartPrintRequest = StartPrintRequest(),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Güvenli baskı akışını arka planda başlatır.

    1. Job'un mevcut durumunu doğrular (yalnızca PENDING veya STREAMING başlatılabilir).
    2. Arka plan görevini tetikler (stream_to_printer).
    3. Üreticiye anında HTTP 202 Accepted döner.

    Akış arka planda devam eder:
      STREAMING → (dosya yükleme) → PRINTING → (yazıcı baskıya başlar)
    """
    _require_producer(current_user)
    job = _verify_job_ownership(job_id, current_user, db)

    # Durum kontrolü – sadece uygun durumlardan başlatılabilir
    allowed_statuses = [
        PrintJobStatus.PENDING.value,
        PrintJobStatus.STREAMING.value,
        PrintJobStatus.FAILED.value,
        PrintJobStatus.COMPLETED.value,
        PrintJobStatus.PRINTING.value,
    ]
    if job.status not in allowed_statuses:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Baskı görevi şu an '{job.status}' durumunda. "
                f"Yalnızca {', '.join(allowed_statuses)} durumlarından başlatılabilir."
            ),
        )

    # Reset progress details for retry / start
    job.status = PrintJobStatus.PENDING.value
    job.progress_percentage = 0.0
    job.current_layer = 0
    job.total_layers = 0
    job.started_at = None
    job.ended_at = None
    db.commit()

    # Arka plan görevini kuyruğa ekle
    background_tasks.add_task(
        stream_service.stream_to_printer,
        job_id=job_id,
        gcode_path=payload.gcode_path,
    )

    return StartPrintResponse(
        message="Baskı akışı arka planda başlatıldı. Durumu takip edebilirsiniz.",
        job_id=job_id,
        status="STREAMING",
    )


@router.get(
    "/{job_id}/status",
    response_model=JobStatusResponse,
    summary="Baskı Durumu",
)
def get_job_status(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Baskı görevinin anlık durumunu döndürür.

    Üretici panelinde gerçek zamanlı ilerleme çubuğu için kullanılır.
    """
    _require_producer(current_user)
    job = _verify_job_ownership(job_id, current_user, db)

    # Yazıcı adını da ekle
    printer = db.query(PrinterProfile).filter(
        PrinterProfile.id == job.printer_id
    ).first()

    return JobStatusResponse(
        id=job.id,
        order_id=job.order_id,
        printer_id=job.printer_id,
        printer_name=printer.brand_model if printer else None,
        status=job.status,
        current_layer=job.current_layer or 0,
        total_layers=job.total_layers or 0,
        progress_percentage=job.progress_percentage or 0.0,
        started_at=job.started_at.isoformat() if job.started_at else None,
        ended_at=job.ended_at.isoformat() if job.ended_at else None,
        created_at=job.created_at.isoformat() if job.created_at else None,
    )
