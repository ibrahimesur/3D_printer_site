import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.requests import Request
from fastapi.exceptions import ResponseValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from app.core.config import settings
from app.api.v1.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama başlarken eksik şema güncellemelerini uygula."""
    try:
        from app.db.migrate import ensure_product_image_urls_column, ensure_secure_print_jobs_gcode_path_column, ensure_product_color_and_filament_type_columns, ensure_product_creator_id_column, ensure_design_category_filament_color_columns
        ensure_product_image_urls_column()
        ensure_secure_print_jobs_gcode_path_column()
        ensure_product_color_and_filament_type_columns()
        ensure_product_creator_id_column()
        ensure_design_category_filament_color_columns()
    except Exception as exc:
        print(f"Şema migrasyonu atlandı: {exc}")
        
    try:
        from app.db.session import engine
        from app.db.base import Base
        from app.models.user import User
        from app.models.product import Product
        from app.models.order import Order
        from app.models.printer_profile import PrinterProfile
        from app.models.secure_print_job import SecurePrintJob
        Base.metadata.create_all(bind=engine)
        print("Tüm tablolar başarıyla kontrol edildi/oluşturuldu.")
    except Exception as exc:
        print(f"Tablo oluşturma atlandı: {exc}")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="3D Baskı Pazaryeri API - Müşterileri 3D yazıcı sahipleriyle buluşturur.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS Middleware ───────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:6001",
        "http://127.0.0.1:6001",
        "https://filamengo.com",
        "https://www.filamengo.com",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include API Routers ──────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)

class CatchAllMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try:
            return await call_next(request)
        except Exception as e:
            import traceback
            err_msg = "".join(traceback.format_exception(type(e), e, e.__traceback__))
            print("MIDDLEWARE CAUGHT UNHANDLED EXCEPTION:", err_msg)
            return JSONResponse(
                status_code=400,
                content={"detail": f"Middleware Catch: {str(e)}", "traceback": err_msg},
                headers={"Access-Control-Allow-Origin": "*"}
            )

app.add_middleware(CatchAllMiddleware)

@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request: Request, exc: ResponseValidationError):
    err_msg = str(exc.errors())
    print("RESPONSE VALIDATION ERROR:", err_msg)
    return JSONResponse(
        status_code=400,
        content={"detail": f"Response Validation Error: {err_msg}", "traceback": err_msg},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    err_msg = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    print(f"Global Error Handled: {err_msg}")
    return JSONResponse(
        status_code=400,
        content={"detail": f"Global Handler: {str(exc)}", "traceback": err_msg},
        headers={"Access-Control-Allow-Origin": "*"}
    )

# ── Serve uploaded files ─────────────────────────────────────
uploads_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


@app.get("/", tags=["Root"])
async def root():
    """API sağlık kontrolü."""
    return {
        "status": "online",
        "project": settings.PROJECT_NAME,
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
async def health_check():
    """Sistem sağlık durumu."""
    return {"status": "healthy"}
