import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="3D Baskı Pazaryeri API - Müşterileri 3D yazıcı sahipleriyle buluşturur.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
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
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include API Routers ──────────────────────────────────────
app.include_router(api_router, prefix=settings.API_V1_STR)

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
