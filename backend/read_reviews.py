from app.db.session import engine
from sqlalchemy import text

with engine.connect() as conn:
    rows = conn.execute(text("SELECT id, user_id, product_id, content FROM reviews ORDER BY id DESC LIMIT 5")).fetchall()
    for row in rows:
        print(row)
