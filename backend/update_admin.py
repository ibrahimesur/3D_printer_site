import psycopg2
conn = psycopg2.connect('postgresql://postgres:postgres@localhost:5432/printer_db')
conn.autocommit = True
cur = conn.cursor()
try:
    cur.execute("UPDATE users SET role = 'ADMIN' WHERE email = 'ibraim2002@gmail.com';")
    print('User role set to ADMIN successfully!')
except Exception as e:
    print('Error:', e)
