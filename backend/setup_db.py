import sys
import os


# 2. Create Tables
try:
    print("Tablolar oluşturuluyor...")
    from app.db.base import Base
    from app.db.session import engine
    
    # Import all models so metadata is populated
    from app.models.user import User
    from app.models.profile import Profile
    from app.models.product import Product
    from app.models.order import Order
    
    Base.metadata.create_all(bind=engine)
    print("Tüm tablolar (User, Profile, Product, Order) başarıyla oluşturuldu!")
except Exception as e:
    print(f"Tablolar oluşturulurken hata: {e}")
