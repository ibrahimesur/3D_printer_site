from app.db.session import SessionLocal
from app.models.user import User

db = SessionLocal()
try:
    users = db.query(User).all()
    for u in users:
        print(u)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
