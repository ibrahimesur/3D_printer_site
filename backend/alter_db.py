import sqlite3
conn = sqlite3.connect('printer_db.db')
conn.execute('ALTER TABLE designs ADD COLUMN file_3d_urls JSON DEFAULT ''[]''')
conn.commit()
conn.close()
