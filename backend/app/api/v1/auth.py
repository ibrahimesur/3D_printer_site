from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.user import User, UserRole

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


class UserProfile(BaseModel):
    id: int
    email: EmailStr
    role: str

    class Config:
        from_attributes = True


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ── Endpoints ─────────────────────────────────────────────────
@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """Yeni kullanıcı kaydı oluşturur."""
    # Check if user already exists
    user = db.query(User).filter(User.email == data.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bu e-posta adresi ile zaten kayıtlı bir kullanıcı var.",
        )
    
    # Tüm açık kayıtlar sadece Müşteri olarak yapılabilir
    user_role = UserRole.CUSTOMER

    # Create user
    hashed_password = get_password_hash(data.password)
    new_user = User(
        email=data.email,
        hashed_password=hashed_password,
        role=user_role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Generate token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=new_user.id, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.post("/login", response_model=Token)
async def login(data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Kullanıcı girişi yapar ve JWT token döner."""
    user = db.query(User).filter(User.email == data.username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
        )
    
    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı",
        )

    # Generate token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer")


@router.get("/me", response_model=UserProfile)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Oturum açmış kullanıcının bilgilerini döner."""
    return current_user


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Şifre sıfırlama bağlantısı oluşturur."""
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        # Güvenlik: Kullanıcı bulunamasa bile aynı mesajı döner
        return {"message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."}

    # Şifre sıfırlama token'ı oluştur (30 dakika geçerli)
    expire = datetime.utcnow() + timedelta(minutes=30)
    reset_token = jwt.encode(
        {"sub": str(user.id), "exp": expire, "type": "password_reset"},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )

    # Gerçek üretimde bu token e-posta ile gönderilir.
    from app.core.email import send_reset_password_email
    email_sent = send_reset_password_email(user.email, reset_token)

    if not email_sent:
        # Eğer SMTP ayarları eksikse dev ortamı için token'ı döndürmeye devam edelim ki testi engellemesin
        return {
            "message": "Şifre sıfırlama bağlantısı oluşturuldu (E-posta gönderilemedi, konsolu kontrol edin).",
            "reset_token": reset_token,
        }

    return {
        "message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
    }

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Token ile şifre sıfırlama işlemi yapar."""
    try:
        payload = jwt.decode(
            data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Geçersiz sıfırlama bağlantısı.",
            )
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Sıfırlama bağlantısı geçersiz veya süresi dolmuş.",
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kullanıcı bulunamadı.",
        )

    user.hashed_password = get_password_hash(data.new_password)
    db.commit()

    return {"message": "Şifreniz başarıyla güncellendi."}
