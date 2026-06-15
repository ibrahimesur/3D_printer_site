from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    PROJECT_NAME: str = "Printer - 3D Baskı Pazaryeri"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = "sqlite:///./printer_db.db"
    
    # Security
    SECRET_KEY: str = "super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    
    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    # Slicer (PrusaSlicer CLI)
    SLICER_BINARY: str = "prusa-slicer"                         # CLI çalıştırılabilir dosya yolu
    SLICER_PROFILES_DIR: str = "slicer_profiles"                # Yazıcı profil dosyalarının bulunduğu dizin
    SLICER_TEMP_DIR: str = ""                                   # Geçici G-code dizini (boş = sistem /tmp)
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
