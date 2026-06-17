from app.db.session import engine
from sqlalchemy import text
with engine.connect() as conn:
    print(conn.execute(text("SELECT email, full_name FROM users WHERE email='test1001@gmail.com'")).fetchone())
