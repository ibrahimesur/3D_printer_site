# 3D Printer Pazaryeri Sitesi

Bu proje Next.js (Frontend) ve FastAPI (Backend) kullanılarak geliştirilmiştir.

## Başka Bir Bilgisayarda Kurulum Adımları

Projeyi ilk kez yeni bir bilgisayara indirdiğinizde, aşağıdaki adımları **sadece bir kez** uygulamanız gerekmektedir. 

### 1. Gereksinimler
- **Python 3.9+** (Backend için)
- **Node.js 18+** (Frontend için)
- **Git** (Projeyi çekmek için)

---

### 2. Backend (Arka Uç) Kurulumu

Terminal (Komut İstemi) üzerinden sırasıyla şu adımları izleyin:

```bash
# 1. Backend klasörüne girin
cd backend

# 2. Sanal ortamı (.venv) oluşturun
python -m venv .venv

# 3. Sanal ortamı aktif edin
.\.venv\Scripts\activate

# 4. Gerekli kütüphaneleri indirin
pip install -r requirements.txt

# 5. Veritabanını hazırlayın
python setup_db.py
```

---

### 3. Frontend (Ön Uç) Kurulumu

Yeni bir terminal sekmesi (veya klasörü) açarak şu adımları izleyin:

```bash
# 1. Ana dizinden frontend klasörüne girin
cd frontend

# 2. Gerekli kütüphaneleri (node_modules) yükleyin
npm install
```

---

### 4. Projeyi Çalıştırma

Tüm kurulumlar tamamlandıktan sonra, projenin **ana dizininde** yer alan `start.bat` dosyasına **çift tıklayarak** hem Frontend'i hem de Backend'i aynı anda otomatik olarak çalıştırabilirsiniz.

**Not:** `start.bat` dosyası otomatik olarak `localhost:3000` adresini Chrome üzerinde açacaktır.
