from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.orders import router as orders_router
from app.api.v1.pricing import router as pricing_router
from app.api.v1.admin import router as admin_router
from app.api.v1.products import router as products_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.favorites import router as favorites_router
from app.api.v1.applications import router as applications_router
from app.api.v1.designs import router as designs_router
from app.api.v1.producer_printers import router as producer_printers_router
from app.api.v1.secure_print import router as secure_print_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(orders_router)
api_router.include_router(pricing_router)
api_router.include_router(admin_router)
api_router.include_router(products_router)
api_router.include_router(reviews_router)
api_router.include_router(favorites_router)
api_router.include_router(applications_router)
api_router.include_router(designs_router)
api_router.include_router(producer_printers_router)
api_router.include_router(secure_print_router)

