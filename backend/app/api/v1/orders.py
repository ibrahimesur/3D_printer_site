from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List

from app.db.session import get_db
from app.models.order import Order, OrderStatus

router = APIRouter(prefix="/orders", tags=["Orders"])

# ── Pydantic Schemas ──────────────────────────────────────────
class CartItemSchema(BaseModel):
    id: int
    quantity: int
    price: float
    name: Optional[str] = None
    filament: Optional[str] = None

class CheckoutRequest(BaseModel):
    items: List[CartItemSchema]

class OrderResponse(BaseModel):
    id: int
    customer_id: int
    product_id: int
    quantity: int
    status: OrderStatus
    total_price: Optional[float] = None

    class Config:
        from_attributes = True

# ── Endpoints ─────────────────────────────────────────────────

@router.post("/checkout", response_model=List[OrderResponse], status_code=status.HTTP_201_CREATED)
def checkout(request: CheckoutRequest, db: Session = Depends(get_db)):
    """Frontend'den sepet verisini alıp veritabanında sipariş oluşturur."""
    created_orders = []
    # Mocking a customer_id since auth is not fully implemented
    mock_customer_id = 1
    
    for item in request.items:
        new_order = Order(
            customer_id=mock_customer_id,
            product_id=item.id,
            quantity=item.quantity,
            total_price=item.price * item.quantity,
            status=OrderStatus.PENDING
        )
        db.add(new_order)
        created_orders.append(new_order)
        
    db.commit()
    for order in created_orders:
        db.refresh(order)
        
    return created_orders

@router.get("/pool", response_model=List[OrderResponse])
def get_order_pool(db: Session = Depends(get_db)):
    """Üreticiler için açık olan işleri listeler (status=pending)."""
    pending_orders = db.query(Order).filter(Order.status == OrderStatus.PENDING).all()
    return pending_orders

from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.profile import Profile

@router.post("/{order_id}/claim", response_model=OrderResponse)
def claim_order(order_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Bir üretici işi aldığında çalışır. Siparişi 'printing' (in production) yapar."""
    if current_user.role != UserRole.PRODUCER:
        raise HTTPException(status_code=403, detail="Sadece üreticiler iş alabilir")

    order = db.query(Order).filter(Order.id == order_id).first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
        
    if order.status != OrderStatus.PENDING or order.producer_id is not None:
        raise HTTPException(status_code=400, detail="Bu iş başkası tarafından alınmış veya artık uygun değil")
        
    order.status = OrderStatus.PRINTING
    order.producer_id = current_user.id
    
    db.commit()
    db.refresh(order)
    
    return order

@router.get("/producer/active", response_model=List[OrderResponse])
def get_producer_active_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Üreticinin aktif işlerini getirir."""
    if current_user.role != UserRole.PRODUCER:
        raise HTTPException(status_code=403, detail="Sadece üreticiler erişebilir")
        
    active_orders = db.query(Order).filter(
        Order.producer_id == current_user.id,
        Order.status.in_([OrderStatus.PRINTING, OrderStatus.SHIPPED])
    ).all()
    return active_orders

@router.get("/producer/stats")
def get_producer_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Üretici istatistiklerini getirir (Bakiye, Teslim Edilen İş Sayısı)."""
    if current_user.role != UserRole.PRODUCER:
        raise HTTPException(status_code=403, detail="Sadece üreticiler erişebilir")
        
    profile = db.query(Profile).filter(Profile.user_id == current_user.id).first()
    balance = profile.balance if profile else 0.0

    delivered_count = db.query(Order).filter(
        Order.producer_id == current_user.id,
        Order.status == OrderStatus.DELIVERED
    ).count()

    return {
        "balance": balance,
        "delivered_count": delivered_count
    }

# Eklenebilecek eski endpointler
@router.get("/")
def list_orders(db: Session = Depends(get_db)):
    """Kullanıcının siparişlerini listeler."""
    return db.query(Order).all()

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Belirli bir siparişin detayını getirir."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Sipariş bulunamadı")
    return order
