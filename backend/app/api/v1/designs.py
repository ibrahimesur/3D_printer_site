import os
import uuid
import shutil
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.api.deps import get_db, get_current_user
from app.models.user import User, UserRole
from app.models.design import Design

router = APIRouter(prefix="/producer/designs", tags=["Producer Designs"])

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "uploads")
IMAGES_DIR = os.path.join(UPLOAD_DIR, "design_images")
FILES_3D_DIR = os.path.join(UPLOAD_DIR, "design_files")

# Ensure directories exist
os.makedirs(IMAGES_DIR, exist_ok=True)
os.makedirs(FILES_3D_DIR, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_3D_EXTENSIONS = {".stl", ".3mf", ".obj"}


# ── Pydantic Schemas ──────────────────────────────────────────

class DesignResponse(BaseModel):
    id: int
    creator_id: int
    title: str
    description: Optional[str] = None
    suggested_price: float
    royalty_percentage: float
    image_urls: list
    file_3d_url: Optional[str] = None
    file_3d_urls: list = []
    category: Optional[str] = None
    filament_type: Optional[str] = None
    color: Optional[str] = None
    is_approved: bool

    class Config:
        from_attributes = True


class DesignCreate(BaseModel):
    title: str
    description: Optional[str] = ""
    suggested_price: float = 0.0
    category: Optional[str] = None
    filament_type: Optional[str] = None
    color: Optional[str] = None
    image_urls: List[str] = []
    file_3d_urls: List[str] = []


def _require_producer(user: User):
    """Yalnızca üretici rolündeki kullanıcıları geçirir."""
    if user.role not in (UserRole.PRODUCER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem yalnızca üreticiler için geçerlidir.",
        )


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
def create_design(
    design: DesignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Üreticinin yeni tasarım eklemesi."""
    _require_producer(current_user)

    new_design = Design(
        creator_id=current_user.id,
        title=design.title,
        description=design.description,
        suggested_price=design.suggested_price,
        royalty_percentage=10.0,  # Sitenin standart telif payı
        category=design.category,
        filament_type=design.filament_type,
        color=design.color,
        image_urls=design.image_urls,
        file_3d_urls=design.file_3d_urls,
        is_approved=False,
    )
    db.add(new_design)
    db.commit()
    db.refresh(new_design)

    return new_design


@router.get("/", response_model=List[DesignResponse])
def list_my_designs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Giriş yapan üreticinin kendi yüklediği tasarımları listeler."""
    _require_producer(current_user)

    designs = (
        db.query(Design)
        .filter(Design.creator_id == current_user.id)
        .order_by(Design.created_at.desc())
        .all()
    )
    return designs


@router.get("/stats")
def design_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Üreticinin toplam tasarım ve telif istatistiklerini döner."""
    _require_producer(current_user)

    designs = db.query(Design).filter(Design.creator_id == current_user.id).all()
    total = len(designs)
    approved = sum(1 for d in designs if d.is_approved)
    pending = total - approved
    total_royalty = sum(
        (d.suggested_price * d.royalty_percentage / 100) for d in designs if d.is_approved
    )

    return {
        "total_designs": total,
        "approved": approved,
        "pending": pending,
        "total_royalty": round(total_royalty, 2),
    }
