import enum
from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class PrinterApiType(str, enum.Enum):
    """Desteklenen yazıcı API türleri."""
    KLIPPER = "Klipper"
    OCTOPRINT = "OctoPrint"
    BAMBULAB = "BambuLab"


class PrinterProfile(Base):
    """Üreticinin 3D yazıcı profili – yazıcı bağlantı bilgileri ve filament slotları."""
    __tablename__ = "printer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    brand_model = Column(String(150), nullable=False)           # Örn: "Bambu Lab P1S"
    nozzle_diameter = Column(Float, default=0.4)                # Örn: 0.2, 0.4, 0.6
    api_type = Column(String(50), nullable=False)               # Klipper / OctoPrint / BambuLab
    api_url = Column(String(500), nullable=False)               # Yazıcı bağlantı adresi
    api_token_encrypted = Column(Text, nullable=True)           # Fernet ile şifrelenmiş API key

    # Üreticinin o anda takılı olan filament slotları
    # Örn: [{"slot": 1, "color": "Neon Orange", "type": "PLA", "is_empty": false}]
    filament_slots = Column(JSON, default=list)

    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    owner = relationship("User", backref="printer_profiles")
    print_jobs = relationship("SecurePrintJob", back_populates="printer")

    def __repr__(self):
        return f"<PrinterProfile(id={self.id}, brand={self.brand_model}, user={self.user_id})>"
