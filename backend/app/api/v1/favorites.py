from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_db, get_current_user, get_current_user_optional
from app.models.favorite import Favorite
from app.models.product import Product
from app.models.user import User

router = APIRouter(prefix="/favorites", tags=["Favorites"])


class ProductBrief(BaseModel):
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


class FavoriteResponse(BaseModel):
    id: int
    product_id: int
    created_at: Optional[datetime] = None
    product: ProductBrief

    class Config:
        from_attributes = True


class FavoriteStatus(BaseModel):
    is_favorited: bool


@router.get("", response_model=List[FavoriteResponse])
def list_favorites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Giriş yapmış kullanıcının favori ürünlerini listeler."""
    favorites = (
        db.query(Favorite)
        .options(joinedload(Favorite.product))
        .filter(Favorite.user_id == current_user.id)
        .order_by(Favorite.created_at.desc())
        .all()
    )
    return favorites


@router.get("/check/{product_id}", response_model=FavoriteStatus)
def check_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_optional),
):
    """Ürünün favorilerde olup olmadığını kontrol eder."""
    if not current_user:
        return FavoriteStatus(is_favorited=False)

    exists = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id,
        )
        .first()
    )
    return FavoriteStatus(is_favorited=exists is not None)


@router.post("/{product_id}", response_model=FavoriteStatus, status_code=status.HTTP_201_CREATED)
def add_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ürünü favorilere ekler."""
    product = db.query(Product).filter(Product.id == product_id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    existing = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id,
        )
        .first()
    )
    if existing:
        return FavoriteStatus(is_favorited=True)

    favorite = Favorite(user_id=current_user.id, product_id=product_id)
    db.add(favorite)
    db.commit()
    return FavoriteStatus(is_favorited=True)


@router.delete("/{product_id}", response_model=FavoriteStatus)
def remove_favorite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ürünü favorilerden çıkarır."""
    favorite = (
        db.query(Favorite)
        .filter(
            Favorite.user_id == current_user.id,
            Favorite.product_id == product_id,
        )
        .first()
    )
    if not favorite:
        raise HTTPException(status_code=404, detail="Favori bulunamadı")

    db.delete(favorite)
    db.commit()
    return FavoriteStatus(is_favorited=False)
