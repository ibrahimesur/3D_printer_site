from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.db.base import Base


class Profile(Base):
    """Üretici profil modeli - yazıcı bilgileri, filament türleri ve bakiye."""
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Printer & material info
    printer_models = Column(JSON, default=list)  # e.g. ["Ender 3", "Prusa MK3S"]
    filaments = Column(JSON, default=list)        # e.g. ["PLA", "ABS", "PETG"]
    
    # Location & finance
    city = Column(String(100), nullable=True)
    balance = Column(Float, default=0.0)

    # Relationships
    user = relationship("User", back_populates="profile")

    def __repr__(self):
        return f"<Profile(id={self.id}, user_id={self.user_id}, city={self.city})>"
