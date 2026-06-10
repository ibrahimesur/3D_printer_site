from app.db.base import Base
from app.db.session import engine
print('Dropping all tables...')
Base.metadata.drop_all(bind=engine)
print('Creating all tables...')
Base.metadata.create_all(bind=engine)
print('Done!')
