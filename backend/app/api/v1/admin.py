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
            "producer_id": order.producer_id,
            "product_id": order.product_id,
            "quantity": order.quantity,
            "status": order.status,
            "total_price": order.total_price,
            "created_at": order.created_at
        }
        for order in orders
    ]
