import enum
from sqlalchemy import Column, Integer, String, Float, ForeignKey, Enum as SAEnum, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class OrderStatus(str, enum.Enum):
    """Sipariş durumları."""
    PENDING = "pending"
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
    
    stl_file_url = Column(String(500), nullable=False)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.PENDING, nullable=False)
    total_price = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    customer = relationship("User", back_populates="customer_orders", foreign_keys=[customer_id])
    producer = relationship("User", back_populates="producer_orders", foreign_keys=[producer_id])

    def __repr__(self):
        return f"<Order(id={self.id}, status={self.status}, price={self.total_price})>"
