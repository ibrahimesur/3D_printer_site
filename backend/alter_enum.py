import sys
import os
sys.path.append(os.getcwd())
from sqlalchemy import text
from app.db.session import engine

try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT enumlabel FROM pg_enum WHERE enumtypid = 'orderstatus'::regtype;"))
        for row in res:
            print(row[0])
        
        # We also want to add 'PAID' since the previous error said: invalid input value for enum orderstatus: "PAID"
        conn.execute(text("ALTER TYPE orderstatus ADD VALUE IF NOT EXISTS 'PAID';"))
        conn.commit()
        print('SUCCESS added PAID')
except Exception as e:
    print('Failed:', e)
