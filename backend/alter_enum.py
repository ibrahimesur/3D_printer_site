import psycopg2
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/printer_db')
conn.autocommit = True
cur = conn.cursor()
try:
    cur.execute("ALTER TYPE userrole ADD VALUE 'ADMIN';")
    print('ADMIN role added to enum!')
except Exception as e:
    print('Error:', e)
