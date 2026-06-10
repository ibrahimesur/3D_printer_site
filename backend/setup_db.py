import sys
import os
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# 1. Create Database
try:
    print("PostgreSQL sunucusuna bağlanılıyor...")
    conn = psycopg2.connect("postgresql://postgres:postgres@localhost:5432/postgres")
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    print("Veritabanı kontrol ediliyor...")
    cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'printer_db'")
    exists = cur.fetchone()
    
    if not exists:
        print("'printer_db' bulunamadı, yeni oluşturuluyor...")
        cur.execute('CREATE DATABASE printer_db')
        print("Veritabanı 'printer_db' başarıyla oluşturuldu!")
    else:
        print("Veritabanı 'printer_db' zaten mevcut.")
        
    cur.close()
    conn.close()
except Exception as e:
    print(f"Veritabanı oluşturulurken hata: {e}")

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
