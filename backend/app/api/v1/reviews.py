from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel, Field

from app.api.deps import get_db, get_current_user, get_current_user_optional
from app.models.review import Review
from app.models.order import Order, OrderStatus
from app.models.user import User

router = APIRouter(tags=["Reviews"])


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


class ReviewResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    user_email: str
    rating: int
    comment: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ReviewSummary(BaseModel):
    average_rating: float
    total_reviews: int
    reviews: List[ReviewResponse]
    can_review: bool = False
    has_reviewed: bool = False
    purchase_required: bool = False


def _mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if len(local) <= 1:
        return f"*@{domain}"
    return f"{local[0]}***@{domain}"


def _user_has_purchased(db: Session, user_id: int, product_id: int) -> bool:
    return (
        db.query(Order)
        .filter(
            Order.customer_id == user_id,
            Order.product_id == product_id,
            Order.status != OrderStatus.CANCELLED,
        )
        .first()
        is not None
    )


def _serialize_review(review: Review) -> ReviewResponse:
    return ReviewResponse(
        id=review.id,
        product_id=review.product_id,
        user_id=review.user_id,
        user_email=_mask_email(review.user.email),
        rating=review.rating,
        comment=review.comment,
        created_at=review.created_at.isoformat() if review.created_at else None,
    )


@router.get("/products/{product_id}/reviews", response_model=ReviewSummary)
def get_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Ürün yorumlarını ve ortalama puanı döner."""
    reviews = (
        db.query(Review)
        .filter(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    avg = db.query(func.avg(Review.rating)).filter(Review.product_id == product_id).scalar()
    average_rating = round(float(avg), 1) if avg else 0.0

    can_review = False
    has_reviewed = False
    purchase_required = False

    if current_user:
        has_reviewed = any(r.user_id == current_user.id for r in reviews)
        purchased = _user_has_purchased(db, current_user.id, product_id)
        purchase_required = not purchased
        can_review = purchased and not has_reviewed

    return ReviewSummary(
        average_rating=average_rating,
        total_reviews=len(reviews),
        reviews=[_serialize_review(r) for r in reviews],
        can_review=can_review,
        has_reviewed=has_reviewed,
        purchase_required=purchase_required if current_user else False,
    )


@router.post(
    "/products/{product_id}/reviews",
    response_model=ReviewResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_product_review(
    product_id: int,
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Satın almış kullanıcılar ürüne puan verebilir."""
    if not _user_has_purchased(db, current_user.id, product_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu ürünü yalnızca satın alan kullanıcılar değerlendirebilir.",
        )

    existing = (
        db.query(Review)
        .filter(Review.product_id == product_id, Review.user_id == current_user.id)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu ürün için zaten değerlendirme yaptınız.",
        )

    review = Review(
        product_id=product_id,
        user_id=current_user.id,
        rating=payload.rating,
        comment=payload.comment.strip() if payload.comment else None,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return _serialize_review(review)
