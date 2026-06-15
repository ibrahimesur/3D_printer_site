"""
Üretici Yazıcı Yönetimi Router'ı – Yazıcı profili CRUD + güvenli baskı görevleri.

Tüm endpoint'ler yalnızca 'producer' veya 'admin' rolüne sahip kullanıcılara açıktır.
"""

from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.printer_profile import PrinterProfile, PrinterApiType
from app.models.secure_print_job import SecurePrintJob, PrintJobStatus
from app.core.encryption import encrypt_token, decrypt_token

router = APIRouter(prefix="/producer/printers", tags=["Producer Printers"])


# ── Helpers ───────────────────────────────────────────────────────

def _require_producer(user: User):
    """Yalnızca üretici veya admin rolündeki kullanıcıları geçirir."""
    if user.role not in (UserRole.PRODUCER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem yalnızca üreticiler için geçerlidir.",
        )


# ── Pydantic Schemas ─────────────────────────────────────────────

class FilamentSlot(BaseModel):
    """Tek bir filament slot bilgisi."""
    slot: int
    color: str
    type: str                 # PLA, PETG, ABS, TPU …
    is_empty: bool = False


class PrinterProfileCreate(BaseModel):
    """Yeni yazıcı profili oluşturma şeması."""
    brand_model: str
    api_type: str             # "Klipper" | "OctoPrint" | "BambuLab"
    api_url: str
    api_token: Optional[str] = None
    filament_slots: List[FilamentSlot] = []

    @field_validator("api_type")
    @classmethod
    def validate_api_type(cls, value: str) -> str:
        allowed = [e.value for e in PrinterApiType]
        if value not in allowed:
            raise ValueError(f"Geçersiz API türü. İzin verilen: {', '.join(allowed)}")
        return value


class PrinterProfileUpdate(BaseModel):
    """Yazıcı profili güncelleme şeması (tüm alanlar opsiyonel)."""
    brand_model: Optional[str] = None
    api_type: Optional[str] = None
    api_url: Optional[str] = None
    api_token: Optional[str] = None
    filament_slots: Optional[List[FilamentSlot]] = None
    is_active: Optional[bool] = None

    @field_validator("api_type")
    @classmethod
    def validate_api_type(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        allowed = [e.value for e in PrinterApiType]
        if value not in allowed:
            raise ValueError(f"Geçersiz API türü. İzin verilen: {', '.join(allowed)}")
        return value


class PrinterProfileResponse(BaseModel):
    """Yazıcı profili API yanıt şeması (api_token gizlenir)."""
    id: int
    user_id: int
    brand_model: str
    api_type: str
    api_url: str
    has_api_token: bool       # Token var mı? (değer asla döndürülmez)
    filament_slots: list
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SecurePrintJobResponse(BaseModel):
    """Güvenli baskı görevi API yanıt şeması."""
    id: int
    order_id: int
    printer_id: int
    status: str
    current_layer: int
    total_layers: int
    progress_percentage: float
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ── Helper: Model → Response ─────────────────────────────────────

def _profile_to_response(profile: PrinterProfile) -> PrinterProfileResponse:
    return PrinterProfileResponse(
        id=profile.id,
        user_id=profile.user_id,
        brand_model=profile.brand_model,
        api_type=profile.api_type,
        api_url=profile.api_url,
        has_api_token=bool(profile.api_token_encrypted),
        filament_slots=profile.filament_slots or [],
        is_active=profile.is_active,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
    )


# ══════════════════════════════════════════════════════════════════
#  YAZICI PROFİLİ ENDPOINT'LERİ
# ══════════════════════════════════════════════════════════════════

@router.post("/", response_model=PrinterProfileResponse, status_code=status.HTTP_201_CREATED)
def create_printer(
    payload: PrinterProfileCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Üreticinin yeni bir yazıcı profili eklemesi."""
    _require_producer(current_user)

    encrypted = encrypt_token(payload.api_token) if payload.api_token else None

    profile = PrinterProfile(
        user_id=current_user.id,
        brand_model=payload.brand_model,
        api_type=payload.api_type,
        api_url=payload.api_url,
        api_token_encrypted=encrypted,
        filament_slots=[slot.model_dump() for slot in payload.filament_slots],
        is_active=True,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _profile_to_response(profile)


@router.get("/", response_model=List[PrinterProfileResponse])
def list_printers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Üreticinin kendi yazıcılarını listeler."""
    _require_producer(current_user)

    printers = (
        db.query(PrinterProfile)
        .filter(PrinterProfile.user_id == current_user.id)
        .order_by(PrinterProfile.created_at.desc())
        .all()
    )
    return [_profile_to_response(p) for p in printers]


@router.get("/{printer_id}", response_model=PrinterProfileResponse)
def get_printer(
    printer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Üreticinin belirli bir yazıcı profilinin detayını getirir."""
    _require_producer(current_user)

    profile = (
        db.query(PrinterProfile)
        .filter(PrinterProfile.id == printer_id, PrinterProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Yazıcı profili bulunamadı")
    return _profile_to_response(profile)


@router.put("/{printer_id}", response_model=PrinterProfileResponse)
def update_printer(
    printer_id: int,
    payload: PrinterProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Var olan bir yazıcı profilini günceller."""
    _require_producer(current_user)

    profile = (
        db.query(PrinterProfile)
        .filter(PrinterProfile.id == printer_id, PrinterProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Yazıcı profili bulunamadı")

    update_data = payload.model_dump(exclude_unset=True)

    # api_token ayrı işlenir (şifreleme gerekli)
    if "api_token" in update_data:
        raw_token = update_data.pop("api_token")
        profile.api_token_encrypted = encrypt_token(raw_token) if raw_token else None

    # filament_slots dict listesine dönüştür
    if "filament_slots" in update_data and update_data["filament_slots"] is not None:
        update_data["filament_slots"] = [
            s.model_dump() if hasattr(s, "model_dump") else s
            for s in update_data["filament_slots"]
        ]

    for key, value in update_data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return _profile_to_response(profile)


@router.delete("/{printer_id}")
def delete_printer(
    printer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Yazıcı profilini pasife alır."""
    _require_producer(current_user)

    profile = (
        db.query(PrinterProfile)
        .filter(PrinterProfile.id == printer_id, PrinterProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Yazıcı profili bulunamadı")

    profile.is_active = False
    db.commit()
    return {"message": "Yazıcı profili pasife alındı"}


# ══════════════════════════════════════════════════════════════════
#  GÜVENLİ BASKI GÖREVİ ENDPOINT'LERİ
# ══════════════════════════════════════════════════════════════════

@router.get("/{printer_id}/jobs", response_model=List[SecurePrintJobResponse])
def list_print_jobs(
    printer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Belirli bir yazıcıya ait baskı görevlerini listeler."""
    _require_producer(current_user)

    # Yazıcının bu kullanıcıya ait olduğunu doğrula
    profile = (
        db.query(PrinterProfile)
        .filter(PrinterProfile.id == printer_id, PrinterProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Yazıcı profili bulunamadı")

    jobs = (
        db.query(SecurePrintJob)
        .filter(SecurePrintJob.printer_id == printer_id)
        .order_by(SecurePrintJob.created_at.desc())
        .all()
    )
    return jobs


@router.get("/{printer_id}/jobs/{job_id}", response_model=SecurePrintJobResponse)
def get_print_job(
    printer_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Belirli bir baskı görevinin detayını getirir (anlık durum)."""
    _require_producer(current_user)

    profile = (
        db.query(PrinterProfile)
        .filter(PrinterProfile.id == printer_id, PrinterProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Yazıcı profili bulunamadı")

    job = (
        db.query(SecurePrintJob)
        .filter(SecurePrintJob.id == job_id, SecurePrintJob.printer_id == printer_id)
        .first()
    )
    if not job:
        raise HTTPException(status_code=404, detail="Baskı görevi bulunamadı")

    return job
