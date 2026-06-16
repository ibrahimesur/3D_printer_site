import enum
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class PrintJobStatus(str, enum.Enum):
    """Güvenli baskı görevi durumları."""
    PENDING = "PENDING"         # Görev oluşturuldu, henüz işleme alınmadı
    SLICING = "SLICING"         # STL → G-code dönüşümü yapılıyor
    STREAMING = "STREAMING"     # G-code satırları yazıcıya akıtılıyor
    PRINTING = "PRINTING"       # Yazıcı aktif olarak basıyor
    COMPLETED = "COMPLETED"     # Baskı başarıyla tamamlandı
    FAILED = "FAILED"           # Baskı sırasında hata oluştu


class SecurePrintJob(Base):
    """Güvenli baskı görevi – buluttan yazıcıya akan G-code akışını ve anlık durumu takip eder."""
    __tablename__ = "secure_print_jobs"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    printer_id = Column(Integer, ForeignKey("printer_profiles.id"), nullable=False)

    status = Column(String(30), default=PrintJobStatus.PENDING, nullable=False)

    # Anlık baskı ilerleme bilgileri (yazıcıdan dönen veriler)
    current_layer = Column(Integer, default=0)
    total_layers = Column(Integer, default=0)              # Toplam katman sayısı (slicing sonrası)
    progress_percentage = Column(Float, default=0.0)       # 0.0 – 100.0
    gcode_path = Column(String(500), nullable=True)

    # Zaman damgaları
    started_at = Column(DateTime(timezone=True), nullable=True)
    ended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    order = relationship("Order", backref="print_jobs")
    printer = relationship("PrinterProfile", back_populates="print_jobs")

    def __repr__(self):
        return (
            f"<SecurePrintJob(id={self.id}, order={self.order_id}, "
            f"printer={self.printer_id}, status={self.status}, progress={self.progress_percentage}%)>"
        )
