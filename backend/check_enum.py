import psycopg2
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/printer_db')
cur = conn.cursor()
cur.execute("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'userrole';")
print([row[0] for row in cur.fetchall()])
