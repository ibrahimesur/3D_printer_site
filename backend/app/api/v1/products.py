from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.api.deps import get_db, get_current_admin_user
from app.models.product import Product

router = APIRouter(tags=["Products"])

# ── Schemas ────────────────────────────────────────────────────────
class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    filament_type: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    filament_type: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProductResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    filament_type: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# ── Admin Endpoints ────────────────────────────────────────────────
@router.post("/admin/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Yeni bir ürün oluşturur (Sadece admin)."""
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/admin/products/{id}", response_model=ProductResponse)
def update_product(id: int, product: ProductUpdate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Var olan bir ürünü günceller (Sadece admin)."""
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    update_data = product.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/admin/products/{id}")
def delete_product(id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Bir ürünü pasife alır (Sadece admin)."""
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    # Soft delete
    db_product.is_active = False
    db.commit()
    return {"message": "Ürün başarıyla pasife alındı"}

@router.get("/admin/products", response_model=List[ProductResponse])
def get_all_products(db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Admin için tüm ürünleri (pasif olanlar dahil) listeler."""
    products = db.query(Product).all()
    return products

# ── Public Endpoints ───────────────────────────────────────────────
@router.get("/products", response_model=List[ProductResponse])
def get_products(db: Session = Depends(get_db)):
    """Müşteriler için aktif ürünleri listeler."""
    products = db.query(Product).filter(Product.is_active == True).all()
    return products

@router.get("/products/{id}/similar", response_model=List[ProductResponse])
def get_similar_products(id: int, db: Session = Depends(get_db)):
    """Aynı kategorideki diğer aktif ürünleri döner."""
    product = db.query(Product).filter(Product.id == id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    query = db.query(Product).filter(Product.is_active == True, Product.id != id)
    if product.category:
        query = query.filter(Product.category == product.category)

    return query.order_by(Product.created_at.desc()).limit(4).all()

@router.get("/products/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    """Müşteriler için tek bir ürünün detayını getirir."""
    product = db.query(Product).filter(Product.id == id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return product
