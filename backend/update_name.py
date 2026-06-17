from app.db.session import engine
from sqlalchemy import text
with engine.connect() as conn:
    conn.execute(text("UPDATE users SET full_name = 'Çağan Kılıçcı' WHERE email = 'cagankiliccitest@gmail.com'"))
    conn.commit()
