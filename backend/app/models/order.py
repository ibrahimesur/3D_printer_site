import enum
from typing import Optional
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    """Sipariş durumları."""
    PENDING = "pending"
    PAID = "paid"
    QUOTED = "quoted"
    ACCEPTED = "accepted"
    PRINTING = "printing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class Order(Base):
    """Sipariş modeli - müşteri ile üretici arasındaki iş akışı."""
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    producer_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Assigned later
    
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    total_price = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    customer = relationship("User", back_populates="customer_orders", foreign_keys=[customer_id])
    producer = relationship("User", back_populates="producer_orders", foreign_keys=[producer_id])
    product = relationship("Product")

    @property
    def print_job_id(self) -> Optional[int]:
        if self.print_jobs:
            return self.print_jobs[0].id
        return None

    def __repr__(self):
        return f"<Order(id={self.id}, product_id={self.product_id}, status={self.status}, price={self.total_price})>"
