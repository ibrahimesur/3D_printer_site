from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.base import Base


class Design(Base):
    """Üretici/tasarımcıların yüklediği 3D tasarım dosyaları modeli."""
    __tablename__ = "designs"

    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    suggested_price = Column(Float, default=0.0)
    royalty_percentage = Column(Float, default=10.0)  # Tasarımcının alacağı yüzde payı
    image_urls = Column(JSON, default=list)  # Görsel URL'leri listesi
    file_3d_url = Column(String(500), nullable=True)  # STL/3MF dosya yolu (Eski)
    file_3d_urls = Column(JSON, default=list)  # Birden fazla STL/3MF dosya yolu
    category = Column(String(50), nullable=True)
    filament_type = Column(String(50), nullable=True)
    color = Column(String(50), nullable=True)
    is_approved = Column(Boolean, default=False)  # Admin onay durumu
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", backref="designs")

    def __repr__(self):
        return f"<Design(id={self.id}, title={self.title}, creator_id={self.creator_id}, approved={self.is_approved})>"
