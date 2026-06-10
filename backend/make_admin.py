import sys
import os

# Yolu ayarlayalım
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.user import User

def make_admin():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        if not users:
            print("❌ Veritabanında hiç kullanıcı bulunamadı! Lütfen önce siteden Kayıt Ol butonuna basarak bir hesap oluşturun.")
            input("Çıkmak için bir tuşa basın...")
            return

        print("Mevcut Kullanıcılar:")
        for i, user in enumerate(users):
            print(f"[{i+1}] {user.email} (Mevcut Rolü: {user.role})")
        
        print("")
        choice = input("Admin yapmak istediğiniz kullanıcının numarasını girin (Örn: 1): ")
        
        try:
            index = int(choice) - 1
            if index < 0 or index >= len(users):
                print("❌ Geçersiz numara!")
                input("Çıkmak için bir tuşa basın...")
                return
            
            selected_user = users[index]
            selected_user.role = "admin"
            db.commit()
            print(f"✅ Başarılı! {selected_user.email} artık bir ADMIN.")
        except ValueError:
            print("❌ Lütfen geçerli bir sayı girin.")
            
        input("Çıkmak için bir tuşa basın...")
    finally:
        db.close()

if __name__ == "__main__":
    make_admin()
