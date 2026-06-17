from app.db.session import engine
from sqlalchemy import text

def fix_foreign_keys():
    queries = [
        "ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;",
        "ALTER TABLE orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE;",
        
        "ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_producer_id_fkey;",
        "ALTER TABLE orders ADD CONSTRAINT orders_producer_id_fkey FOREIGN KEY (producer_id) REFERENCES users(id) ON DELETE SET NULL;",
        
        "ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;",
        "ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;",
        
        "ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_product_id_fkey;",
        "ALTER TABLE reviews ADD CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;",
    ]
    
    with engine.connect() as conn:
        for q in queries:
            try:
                conn.execute(text(q))
                conn.commit()
                print(f"Başarılı: {q}")
            except Exception as e:
                print(f"Hata/Atlandı: {q} - {str(e)}")

if __name__ == "__main__":
    fix_foreign_keys()
    print("Veritabanı foreign key (ikincil anahtar) kuralları güncellendi!")
