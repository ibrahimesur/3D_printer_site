from supabase import create_client, Client
from app.core.config import settings
import re

def get_supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def extract_filename_from_url(url: str) -> str:
    """Extracts the file path from a Supabase public URL or relative path."""
    if not url:
        return ""
    # If it's a full supabase URL
    if "supabase.co/storage/v1/object/public/" in url:
        parts = url.split("supabase.co/storage/v1/object/public/")
        if len(parts) > 1:
            path = parts[1]
            # path is something like "product-images/xyz.jpg"
            # We just need the filename part "xyz.jpg" if the bucket name is known,
            # but supabase remove takes the path relative to the bucket.
            bucket_and_file = path.split("/", 1)
            if len(bucket_and_file) > 1:
                return bucket_and_file[1]
    # Fallback: just get the last part
    return url.split("/")[-1]

def delete_supabase_files(bucket_name: str, file_urls: list[str]):
    """Deletes a list of files from a Supabase bucket."""
    if not file_urls:
        return
        
    client = get_supabase_client()
    paths_to_delete = []
    
    for url in file_urls:
        if not url:
            continue
        filename = extract_filename_from_url(url)
        if filename:
            paths_to_delete.append(filename)
            
    if paths_to_delete:
        try:
            client.storage.from_(bucket_name).remove(paths_to_delete)
        except Exception as e:
            print(f"Error deleting from Supabase bucket {bucket_name}: {e}")
