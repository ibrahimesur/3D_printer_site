from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from typing import List

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.application import ProducerApplication, ApplicationStatus
from app.core.security import get_password_hash

router = APIRouter(prefix="/applications", tags=["Producer Applications"])

# ── Pydantic Schemas ──────────────────────────────────────────

class ApplicationCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    printer_info: str
    experience: str

class ApplicationResponse(BaseModel):
    id: int
    full_name: str
    email: str
    printer_info: str
    experience: str
    status: str

    class Config:
        from_attributes = True

# ── Endpoints ─────────────────────────────────────────────────

@router.post("/apply", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_producer(data: ApplicationCreate, db: Session = Depends(get_db)):
    """Müşteri hesabı oluşturup üretici başvurusunda bulunur."""
    # E-posta kullanımda mı kontrol et
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi zaten kullanımda.",
        )
    
    app_exists = db.query(ProducerApplication).filter(ProducerApplication.email == data.email).first()
    if app_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresiyle zaten bir başvuru yapılmış.",
        )

    # Kullanıcıyı müşteri olarak kaydet (böylece siteye girebilsin)
    hashed_password = get_password_hash(data.password)
    new_user = User(
        email=data.email,
        hashed_password=hashed_password,
        role=UserRole.CUSTOMER
    )
    db.add(new_user)
    
    # Başvuruyu kaydet
    new_app = ProducerApplication(
        full_name=data.full_name,
        email=data.email,
        printer_info=data.printer_info,
        experience=data.experience,
        status=ApplicationStatus.PENDING
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    return new_app


@router.get("/", response_model=List[ApplicationResponse])
def get_applications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Tüm başvuruları listeler (Sadece Admin)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece yöneticiler başvuruları görebilir.")
    
    return db.query(ProducerApplication).order_by(ProducerApplication.created_at.desc()).all()


@router.put("/{app_id}/approve", response_model=ApplicationResponse)
def approve_application(app_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Başvuruyu onaylar ve kullanıcının rolünü producer yapar (Sadece Admin)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece yöneticiler onay verebilir.")
    
    app = db.query(ProducerApplication).filter(ProducerApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Başvuru bulunamadı.")
    
    if app.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu başvuru zaten işlenmiş.")

    # Kullanıcıyı bul ve rolünü yükselt
    user = db.query(User).filter(User.email == app.email).first()
    if user:
        user.role = UserRole.PRODUCER
    
    app.status = ApplicationStatus.APPROVED
    db.commit()
    db.refresh(app)
    
    return app


@router.put("/{app_id}/reject", response_model=ApplicationResponse)
def reject_application(app_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Başvuruyu reddeder (Sadece Admin)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Sadece yöneticiler reddedebilir.")
    
    app = db.query(ProducerApplication).filter(ProducerApplication.id == app_id).first()
    if not app:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Başvuru bulunamadı.")
    
    if app.status != ApplicationStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Bu başvuru zaten işlenmiş.")

    app.status = ApplicationStatus.REJECTED
    db.commit()
    db.refresh(app)
    
    return app
