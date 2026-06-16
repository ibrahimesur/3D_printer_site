from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from app.db.base import Base

class Product(Base):
    """Hazır 3D ürün modeli."""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    price = Column(Float, nullable=False)
    category = Column(String(50), nullable=True)
    filament_type = Column(String(50), nullable=True)  # PLA, PETG vs.
    color = Column(String(50), nullable=True)  # Neon Orange, Siyah vs.
    image_url = Column(String(500), nullable=True)  # Birincil görsel (geriye uyumluluk)
    image_urls = Column(JSON, default=list)  # Tüm ürün görselleri
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=True) # Bağlı olduğu tasarım
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=True) # Ürünün sahibi (üretici)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<Product(id={self.id}, title={self.title}, price={self.price})>"
