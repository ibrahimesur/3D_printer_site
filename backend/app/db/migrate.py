"""Veritabanı şema güncellemeleri."""
import json

from sqlalchemy import inspect, text

from app.db.session import engine


def _column_exists(table: str, column: str) -> bool:
    inspector = inspect(engine)
    return column in {col["name"] for col in inspector.get_columns(table)}


def ensure_user_full_name_column() -> None:
    """users tablosuna full_name sütununu ekler."""
    if not _column_exists("users", "full_name"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE users ADD COLUMN full_name VARCHAR(255)"))
            print("full_name sütunu users tablosuna eklendi.")


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


def ensure_secure_print_jobs_gcode_path_column() -> None:
    """secure_print_jobs tablosuna gcode_path sütunu ekler."""
    if _column_exists("secure_print_jobs", "gcode_path"):
        return

    with engine.begin() as conn:
        conn.execute(
            text("ALTER TABLE secure_print_jobs ADD COLUMN gcode_path VARCHAR(500)")
        )
        print("gcode_path sütunu secure_print_jobs tablosuna eklendi.")


def ensure_product_color_and_filament_type_columns() -> None:
    """products tablosuna color ve filament_type sütunlarını ekler."""
    if not _column_exists("products", "color"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE products ADD COLUMN color VARCHAR(50)"))
            print("color sütunu products tablosuna eklendi.")
            
    if not _column_exists("products", "filament_type"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE products ADD COLUMN filament_type VARCHAR(50)"))
            print("filament_type sütunu products tablosuna eklendi.")


def ensure_product_creator_id_column() -> None:
    """products tablosuna creator_id sütununu ekler."""
    if not _column_exists("products", "creator_id"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE products ADD COLUMN creator_id INTEGER REFERENCES users(id)"))
            print("creator_id sütunu products tablosuna eklendi.")


def ensure_design_category_filament_color_columns() -> None:
    """designs tablosuna category, filament_type ve color sütunlarını ekler."""
    if not _column_exists("designs", "category"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE designs ADD COLUMN category VARCHAR(50)"))
            print("category sütunu designs tablosuna eklendi.")
            
    if not _column_exists("designs", "filament_type"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE designs ADD COLUMN filament_type VARCHAR(50)"))
            print("filament_type sütunu designs tablosuna eklendi.")
            
    if not _column_exists("designs", "color"):
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE designs ADD COLUMN color VARCHAR(50)"))
            print("color sütunu designs tablosuna eklendi.")

    if not _column_exists("designs", "file_3d_urls"):
        with engine.begin() as conn:
            if engine.dialect.name == "postgresql":
                conn.execute(text("ALTER TABLE designs ADD COLUMN file_3d_urls JSON DEFAULT '[]'::json"))
            else:
                conn.execute(text("ALTER TABLE designs ADD COLUMN file_3d_urls JSON"))
            
            # Migrate old single file_3d_url to the new file_3d_urls list
            rows = conn.execute(text("SELECT id, file_3d_url FROM designs WHERE file_3d_url IS NOT NULL AND file_3d_url != ''")).fetchall()
            for row in rows:
                conn.execute(
                    text("UPDATE designs SET file_3d_urls = :urls WHERE id = :id"),
                    {"id": row.id, "urls": json.dumps([row.file_3d_url])},
                )
            print(f"file_3d_urls sütunu designs tablosuna eklendi ve {len(rows)} satır güncellendi.")

