import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("ALTER TABLE designs ADD COLUMN IF NOT EXISTS file_3d_urls JSON DEFAULT '[]'"))
    conn.commit()
print('done')
