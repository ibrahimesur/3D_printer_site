"""products tablosuna image_urls sütunu ekler ve mevcut image_url değerlerini taşır."""
from app.db.migrate import ensure_product_image_urls_column


def main() -> None:
    ensure_product_image_urls_column()
    print("Migrasyon tamamlandı.")


if __name__ == "__main__":
    main()
