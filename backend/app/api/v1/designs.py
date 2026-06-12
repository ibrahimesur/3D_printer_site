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
    is_approved: bool

    class Config:
        from_attributes = True


def _require_producer(user: User):
    """Yalnızca üretici rolündeki kullanıcıları geçirir."""
    if user.role not in (UserRole.PRODUCER, UserRole.ADMIN):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem yalnızca üreticiler için geçerlidir.",
        )


# ── Endpoints ─────────────────────────────────────────────────

@router.post("/", response_model=DesignResponse, status_code=status.HTTP_201_CREATED)
async def create_design(
    title: str = Form(...),
    description: str = Form(""),
    suggested_price: float = Form(0.0),
    images: List[UploadFile] = File(default=[]),
    files_3d: List[UploadFile] = File(default=[]),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Üreticinin yeni tasarım eklemesi, ürün fotoğraflarını ve 3D dosyasını yükler."""
    _require_producer(current_user)

    saved_image_urls = []
    saved_3d_urls = []

    from supabase import create_client, Client
    from app.core.config import settings
    
    supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

    # Save product images to Supabase
    for img in images:
        ext = os.path.splitext(img.filename or "")[1].lower()
        if ext not in ALLOWED_IMAGE_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Geçersiz görsel formatı: {ext}. İzin verilen: {', '.join(ALLOWED_IMAGE_EXTENSIONS)}",
            )
        unique_name = f"{uuid.uuid4().hex}{ext}"
        # Upload image to product-images bucket
        file_content = await img.read()
        
        # Determine content type
        content_type = "image/jpeg"
        if ext == ".png":
            content_type = "image/png"
        elif ext == ".webp":
            content_type = "image/webp"

        try:
            supabase.storage.from_("product-images").upload(
                unique_name, 
                file_content,
                file_options={"content-type": content_type}
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Görsel Supabase'e yüklenirken hata oluştu (Sunucuyu yeniden başlattınız mı?): {str(e)}",
            )
        
        # Get public url and save it
        public_url = supabase.storage.from_("product-images").get_public_url(unique_name)
        saved_image_urls.append(public_url)

    # Save 3D files to Supabase
    
    for f3d in files_3d:
        if f3d and f3d.filename:
            ext = os.path.splitext(f3d.filename)[1].lower()
            if ext not in ALLOWED_3D_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Geçersiz 3D dosya formatı: {ext}. İzin verilen: {', '.join(ALLOWED_3D_EXTENSIONS)}",
                )
            unique_name = f"{uuid.uuid4().hex}_{f3d.filename}"
            # Read file content
            file_content = await f3d.read()
            try:
                res = supabase.storage.from_("product-stls").upload(unique_name, file_content)
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"3D Dosya Supabase'e yüklenirken hata oluştu (Sunucuyu yeniden başlattınız mı?): {str(e)}",
                )
            
            # Just save the unique filename in the DB (can't download without signed url anyway)
            saved_3d_urls.append(unique_name)

    new_design = Design(
        creator_id=current_user.id,
        title=title,
        description=description,
        suggested_price=suggested_price,
        royalty_percentage=10.0,  # Sitenin standart telif payı
        image_urls=saved_image_urls,
        file_3d_urls=saved_3d_urls,
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
