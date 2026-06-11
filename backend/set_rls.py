from app.db.session import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        conn.execute(text("CREATE POLICY \"Allow public uploads\" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'product-images');"))
        conn.commit()
    print("Storage policy successfully created!")
except Exception as e:
    print(f"Error creating policy: {e}")
