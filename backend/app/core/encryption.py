"""
Şifreleme yardımcıları – Yazıcı API token'larını Fernet simetrik şifreleme ile korur.

Fernet, python-jose[cryptography] bağımlılığında bulunan `cryptography` kütüphanesini kullanır.
Şifreleme anahtarı olarak settings.SECRET_KEY'den türetilmiş 32-byte URL-safe base64 anahtar oluşturulur.
"""

import base64
import hashlib

from cryptography.fernet import Fernet

from app.core.config import settings


def _derive_fernet_key(secret: str) -> bytes:
    """SECRET_KEY'den sabit 32-byte Fernet anahtarı türetir."""
    digest = hashlib.sha256(secret.encode()).digest()
    return base64.urlsafe_b64encode(digest)


_fernet = Fernet(_derive_fernet_key(settings.SECRET_KEY))


def encrypt_token(plain_text: str) -> str:
    """Düz metin API token'ını şifreler, base64 string olarak döner."""
    return _fernet.encrypt(plain_text.encode()).decode()


def decrypt_token(cipher_text: str) -> str:
    """Şifrelenmiş API token'ını çözer, düz metin olarak döner."""
    return _fernet.decrypt(cipher_text.encode()).decode()
