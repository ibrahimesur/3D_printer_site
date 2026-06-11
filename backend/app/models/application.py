import enum
from sqlalchemy import Column, Integer, String, Text, DateTime, Enum as SAEnum
from datetime import datetime

from app.db.base import Base

class ApplicationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

class ProducerApplication(Base):
    """Üretici başvuru modeli"""
    __tablename__ = "producer_applications"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), index=True, nullable=False)
    printer_info = Column(Text, nullable=False)
    experience = Column(Text, nullable=False)
    status = Column(SAEnum(ApplicationStatus), default=ApplicationStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ProducerApplication(id={self.id}, email={self.email}, status={self.status})>"
