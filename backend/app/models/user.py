import enum
from sqlalchemy import Column, Integer, String, Boolean, Enum as SAEnum
from sqlalchemy.orm import relationship

from app.db.base import Base


class UserRole(str, enum.Enum):
    """Kullanıcı rolleri: müşteri veya üretici."""
    CUSTOMER = "customer"
    PRODUCER = "producer"
    ADMIN = "admin"


class User(Base):
    """Kullanıcı modeli - tüm platform kullanıcılarını temsil eder."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.CUSTOMER, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relationships
    profile = relationship("Profile", back_populates="user", uselist=False)
    customer_orders = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")
    producer_orders = relationship("Order", back_populates="producer", foreign_keys="Order.producer_id")

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, role={self.role})>"
