# Python 3.11 tabanlı hafif bir imaj kullanıyoruz
FROM python:3.11-slim

# PrusaSlicer'ın Linux ortamında çalışması için gereken sistem kütüphaneleri
# (Render sunucularında grafik arayüzü olmadığı için headless çalışması gerekir, 
# ancak PrusaSlicer arka planda bile OpenGL ve GTK bağımlılıkları arar)
RUN apt-get update && apt-get install -y \
    wget \
    bzip2 \
    tar \
    libgl1 \
    libglu1-mesa \
    libgtk-3-0 \
    libosmesa6 \
    && rm -rf /var/lib/apt/lists/*

# PrusaSlicer Linux AppImage veya Binary dosyasını indir
WORKDIR /opt
# Not: En son stabil CLI destekli PrusaSlicer sürümünü indiriyoruz
RUN wget https://github.com/prusa3d/PrusaSlicer/releases/download/version_2.7.4/PrusaSlicer-2.7.4+linux-x64-GTK3-202404051128.tar.bz2 -O prusaslicer.tar.bz2 \
    && tar -xf prusaslicer.tar.bz2 \
    && rm prusaslicer.tar.bz2 \
    && mv PrusaSlicer* prusaslicer

# PrusaSlicer komutunu sistem yoluna ekle
ENV PATH="/opt/prusaslicer:${PATH}"
# Backend'in Slicer'ı bulması için çevre değişkeni
ENV SLICER_BINARY="prusa-slicer"

# Python uygulamasını kur
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kaynak kodları kopyala
COPY . .

# FastAPI için port izni
EXPOSE 8000

# Uygulamayı başlat
# Render üzerinde PORT çevre değişkeni otomatik olarak gelir, bu yüzden --port $PORT kullanacağız
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
