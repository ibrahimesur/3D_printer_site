from app.db.base import Base
from app.db.session import engine
from app.models.user import User
from app.models.profile import Profile
from app.models.product import Product
from app.models.order import Order

print("Creating SQLite database tables...")
Base.metadata.create_all(bind=engine)
print("Tables created successfully!")
