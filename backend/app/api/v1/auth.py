from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ── Pydantic Schemas ──────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    role: str = "customer"  # "customer" | "producer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ── Endpoints ─────────────────────────────────────────────────
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    """Yeni kullanıcı kaydı oluşturur."""
    # TODO: Implement registration logic
    return Token(access_token="dummy-token")


@router.post("/login", response_model=Token)
async def login(data: UserLogin):
    """Kullanıcı girişi yapar ve JWT token döner."""
    # TODO: Implement login logic
    return Token(access_token="dummy-token")


@router.get("/me")
async def get_current_user():
    """Oturum açmış kullanıcının bilgilerini döner."""
    # TODO: Implement current user retrieval
    return {"message": "Current user endpoint - not yet implemented"}
