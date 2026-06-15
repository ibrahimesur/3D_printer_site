import os
import sys

# Setup paths
sys.path.append("c:\\Users\\Çağan\\Desktop\\3D_printer_site\\backend")

from sqlalchemy import create_engine, or_
from sqlalchemy.orm import sessionmaker
from app.models.product import Product

engine = create_engine("sqlite:///./sql_app.db")
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

search = "Dünya"
search_term = f"%{search}%"
query = db.query(Product).filter(Product.is_active == True)
query = query.filter(
    or_(
        Product.title.ilike(search_term),
        Product.description.ilike(search_term),
        Product.category.ilike(search_term)
    )
)

products = query.all()
print("Direct DB query returned count:", len(products))
for p in products:
    print("-", p.title)

db.close()
