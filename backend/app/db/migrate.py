"""Veritabanı şema güncellemeleri."""
import json

from sqlalchemy import inspect, text

from app.db.session import engine


def _column_exists(table: str, column: str) -> bool:
    inspector = inspect(engine)
    return column in {col["name"] for col in inspector.get_columns(table)}


def ensure_product_image_urls_column() -> None:
    """products tablosuna image_urls sütunu ekler ve mevcut image_url değerlerini taşır."""
    if _column_exists("products", "image_urls"):
        return

    with engine.begin() as conn:
        if engine.dialect.name == "postgresql":
            conn.execute(
                text("ALTER TABLE products ADD COLUMN image_urls JSON DEFAULT '[]'::json")
            )
        else:
            conn.execute(text("ALTER TABLE products ADD COLUMN image_urls JSON"))

        rows = conn.execute(
            text("SELECT id, image_url FROM products WHERE image_url IS NOT NULL AND image_url != ''")
        ).fetchall()

        for row in rows:
            conn.execute(
                text("UPDATE products SET image_urls = :urls WHERE id = :id"),
                {"id": row.id, "urls": json.dumps([row.image_url])},
            )

        print(f"image_urls sütunu eklendi, {len(rows)} ürün güncellendi.")
