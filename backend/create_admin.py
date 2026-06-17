from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

db = SessionLocal()
try:
    admin_email = "admin@filamengo.com"
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        print("Admin user already exists.")
    else:
        new_admin = User(
            email=admin_email,
            hashed_password=get_password_hash("admin"),
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(new_admin)
        db.commit()
        print("Admin user created successfully! Email: admin@filamengo.com | Password: admin")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
