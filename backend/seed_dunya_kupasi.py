from app.db.session import SessionLocal
from app.models.product import Product

PRODUCT = {
    "title": "Dünya Kupası",
    "description": "FIFA Dünya Kupası kupasının detaylı 3D baskı replikası. Masaüstü dekorasyonu ve koleksiyon için ideal.",
    "price": 349.99,
    "category": "Dekorasyon",
    "filament_type": "PLA",
    "image_url": None,
    "is_active": True,
}

db = SessionLocal()
try:
    existing = db.query(Product).filter(Product.title == PRODUCT["title"]).first()
    if existing:
        print(f"Ürün zaten mevcut: id={existing.id}, title={existing.title}")
    else:
        product = Product(**PRODUCT)
        db.add(product)
        db.commit()
        db.refresh(product)
        print(f"Ürün oluşturuldu: id={product.id}, title={product.title}, price={product.price}")
except Exception as e:
    db.rollback()
    import traceback
    traceback.print_exc()
finally:
    db.close()
