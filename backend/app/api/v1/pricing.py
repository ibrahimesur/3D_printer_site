from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/pricing", tags=["Pricing"])


# ── Pydantic Schemas ──────────────────────────────────────────
class PricingRequest(BaseModel):
    stl_file_url: str
    filament_type: str = "PLA"
    infill_percentage: int = 20
    layer_height: float = 0.2


class PricingResponse(BaseModel):
    estimated_price: float
    estimated_time_hours: float
    filament_used_grams: float
    breakdown: dict


# ── Endpoints ─────────────────────────────────────────────────
@router.post("/estimate", response_model=PricingResponse)
async def estimate_price(request: PricingRequest):
    """STL dosyası için tahmini fiyat hesaplar."""
    # TODO: Implement 3D pricing engine
    return PricingResponse(
        estimated_price=49.99,
        estimated_time_hours=3.5,
        filament_used_grams=45.0,
        breakdown={
            "material_cost": 15.0,
            "machine_time_cost": 25.0,
            "platform_fee": 9.99,
        }
    )


@router.get("/filaments")
async def list_filament_types():
    """Desteklenen filament türlerini ve birim fiyatlarını listeler."""
    # TODO: Pull from database
    return {
        "filaments": [
            {"type": "PLA", "price_per_gram": 0.30, "colors": ["Beyaz", "Siyah", "Kırmızı", "Mavi"]},
            {"type": "ABS", "price_per_gram": 0.35, "colors": ["Beyaz", "Siyah"]},
            {"type": "PETG", "price_per_gram": 0.40, "colors": ["Şeffaf", "Siyah", "Beyaz"]},
            {"type": "TPU", "price_per_gram": 0.55, "colors": ["Siyah", "Beyaz"]},
        ]
    }
