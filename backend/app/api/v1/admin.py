from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_admin_user
from app.models.user import User
from app.models.order import Order


router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/users")
async def get_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Sistemdeki tüm kullanıcıları (Admin dahil) listeler."""
    users = db.query(User).all()
    # Pydantic şeması olmadan dönmek için manuel mapliyoruz veya UserProfile kullanıyoruz
    return [
        {
            "id": user.id,
            "email": user.email,
            "role": user.role,
            "is_active": user.is_active
        }
        for user in users
    ]

@router.get("/users/{id}/printers")
async def get_user_printers(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Admin'in bir kullanıcının (özellikle üreticilerin) yazıcılarını görmesini sağlar."""
    from app.models.printer_profile import PrinterProfile
    printers = db.query(PrinterProfile).filter(PrinterProfile.user_id == id).all()
    return [
        {
            "id": p.id,
            "brand_model": p.brand_model,
            "nozzle_diameter": p.nozzle_diameter,
            "api_type": p.api_type,
            "api_url": p.api_url,
            "filament_slots": p.filament_slots,
            "is_active": p.is_active
        }
        for p in printers
    ]

@router.get("/orders")
async def get_all_orders(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Sistemdeki tüm siparişleri listeler."""
    orders = db.query(Order).all()
    return [
        {
            "id": order.id,
            "customer_id": order.customer_id,
            "customer_email": order.customer.email if order.customer else None,
            "producer_id": order.producer_id,
            "producer_email": order.producer.email if order.producer else None,
            "product_id": order.product_id,
            "product_title": order.product.title if order.product else "Bilinmeyen Ürün",
            "quantity": order.quantity,
            "status": order.status,
            "total_price": order.total_price,
            "created_at": order.created_at
        }
        for order in orders
    ]


from pydantic import BaseModel
from typing import Optional

class ReassignOrderRequest(BaseModel):
    producer_id: Optional[int] = None

@router.patch("/orders/{id}/reassign")
async def reassign_order(
    id: int,
    request: ReassignOrderRequest,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Adminin siparişi başka bir üreticiye atamasını veya havuza geri göndermesini sağlar."""
    from fastapi import HTTPException
    from app.models.order import OrderStatus
    
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
        
    if request.producer_id is None:
        # Havuza geri at
        order.producer_id = None
        order.status = OrderStatus.PENDING
    else:
        # Başka bir üreticiye ata
        # İsteğe bağlı olarak üreticinin var olup olmadığını kontrol edebilirsiniz
        producer = db.query(User).filter(User.id == request.producer_id, User.role == "producer").first()
        if not producer:
            raise HTTPException(status_code=400, detail="Geçerli bir üretici (producer) seçmelisiniz.")
            
        order.producer_id = request.producer_id
        order.status = OrderStatus.ACCEPTED

    db.commit()
    return {"message": "Sipariş ataması güncellendi", "status": order.status, "producer_id": order.producer_id}


@router.patch("/orders/{id}/cancel")
async def cancel_order(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Adminin siparişi iptal etmesini sağlar."""
    from fastapi import HTTPException
    from app.models.order import OrderStatus
    
    order = db.query(Order).filter(Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
        
    order.status = OrderStatus.CANCELLED
    order.producer_id = None
    db.commit()
    return {"message": "Sipariş iptal edildi", "status": order.status}


@router.get("/designs/pending")
async def get_pending_designs(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Admin için onay bekleyen tüm tasarımları listeler."""
    from app.models.design import Design
    designs = db.query(Design).filter(Design.is_approved == False).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "description": d.description,
            "price": d.suggested_price,
            "image_url": d.image_urls[0] if d.image_urls else None,
            "image_urls": d.image_urls,
            "file_3d_urls": getattr(d, 'file_3d_urls', getattr(d, 'file_3d_url', None)),
            "creator_id": d.creator_id,
            "creator_email": d.creator.email if d.creator else "Bilinmiyor",
            "is_approved": d.is_approved
        }
        for d in designs
    ]


@router.post("/designs/{id}/approve")
async def approve_design(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Bir tasarımı onaylar ve onu aktif bir ürüne dönüştürür."""
    from app.models.design import Design
    from app.models.product import Product
    from fastapi import HTTPException

    design = db.query(Design).filter(Design.id == id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Tasarım bulunamadı")
    if design.is_approved:
        raise HTTPException(status_code=400, detail="Tasarım zaten onaylanmış")

    # Tasarımı onaylı olarak işaretle
    design.is_approved = True

    # Tasarımdan yeni bir ürün oluştur
    new_product = Product(
        title=design.title,
        description=design.description,
        price=design.suggested_price,
        image_urls=design.image_urls,
        image_url=design.image_urls[0] if design.image_urls else None,
        is_active=True,
        design_id=design.id,
        creator_id=design.creator_id,
        category=design.category,
        filament_type=design.filament_type,
        color=design.color
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return {"message": "Tasarım onaylandı ve ürün oluşturuldu", "product_id": new_product.id}


@router.delete("/designs/{id}/reject")
async def reject_design(
    id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    """Bir tasarımı reddeder ve sistemden siler."""
    from app.models.design import Design
    from fastapi import HTTPException

    design = db.query(Design).filter(Design.id == id).first()
    if not design:
        raise HTTPException(status_code=404, detail="Tasarım bulunamadı")

    # Delete files from Supabase
    try:
        from app.core.supabase_utils import delete_supabase_files
        if design.image_urls:
            delete_supabase_files("product-images", design.image_urls)
        if design.file_3d_urls:
            delete_supabase_files("product-stls", design.file_3d_urls)
    except Exception as e:
        print(f"Failed to delete files from Supabase: {e}")

    db.delete(design)
    db.commit()

    return {"message": "Tasarım reddedildi ve silindi"}
