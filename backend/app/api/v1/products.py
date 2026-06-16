from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
from pydantic import BaseModel, field_validator

from app.api.deps import get_db, get_current_admin_user
from app.models.product import Product

router = APIRouter(tags=["Products"])


def normalize_image_fields(data: dict) -> dict:
    """image_urls ile image_url alanlarını senkron tutar."""
    if "image_urls" in data:
        urls = [url.strip() for url in (data.get("image_urls") or []) if url and str(url).strip()]
        data["image_urls"] = urls
        data["image_url"] = urls[0] if urls else None
    elif "image_url" in data:
        url = data.get("image_url")
        if url and str(url).strip():
            data["image_urls"] = [str(url).strip()]
            data["image_url"] = str(url).strip()
        else:
            data["image_urls"] = []
            data["image_url"] = None
    return data


def apply_image_fields(product: Product, data: dict) -> None:
    """JSON image_urls sütununu güvenilir şekilde günceller."""
    if "image_urls" in data:
        urls = data["image_urls"]
        product.image_urls = urls
        product.image_url = urls[0] if urls else None
        flag_modified(product, "image_urls")
    elif "image_url" in data:
        url = data.get("image_url")
        product.image_url = url
        product.image_urls = [url] if url else []
        flag_modified(product, "image_urls")


def product_to_response(product: Product) -> "ProductResponse":
    urls = list(product.image_urls or [])
    if not urls and product.image_url:
        urls = [product.image_url]
    
    file_3d_urls = []
    creator_id = None
    creator_email = None
    if product.design_id:
        from app.models.design import Design
        from app.db.session import SessionLocal
        with SessionLocal() as db:
            design = db.query(Design).filter(Design.id == product.design_id).first()
            if design:
                if design.file_3d_urls:
                    file_3d_urls = list(design.file_3d_urls)
                creator_id = design.creator_id
                if design.creator:
                    creator_email = design.creator.email

    return ProductResponse(
        id=product.id,
        title=product.title,
        description=product.description,
        price=product.price,
        category=product.category,
        filament_type=product.filament_type,
        color=product.color,
        image_url=urls[0] if urls else product.image_url,
        image_urls=urls,
        file_3d_urls=file_3d_urls,
        is_active=product.is_active,
        creator_id=creator_id,
        creator_email=creator_email
    )


# ── Schemas ────────────────────────────────────────────────────────
class ProductCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    filament_type: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: List[str] = []
    file_3d_urls: List[str] = []
    is_active: bool = True

    @field_validator("image_urls", mode="before")
    @classmethod
    def ensure_image_urls_list(cls, value):
        if value is None:
            return []
        return value


class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    filament_type: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    file_3d_urls: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    filament_type: Optional[str] = None
    color: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: List[str] = []
    file_3d_urls: List[str] = []
    is_active: bool
    creator_id: Optional[int] = None
    creator_email: Optional[str] = None

    class Config:
        from_attributes = True


# ── Admin Endpoints ────────────────────────────────────────────────
@router.post("/admin/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Yeni bir ürün oluşturur (Sadece admin)."""
    product_data = normalize_image_fields(product.model_dump())
    image_urls = product_data.pop("image_urls", [])
    image_url = product_data.pop("image_url", None)
    file_3d_urls = product_data.pop("file_3d_urls", [])

    design_id = None
    if file_3d_urls:
        from app.models.design import Design
        new_design = Design(
            title=product.title,
            description=product.description,
            suggested_price=product.price,
            image_urls=image_urls,
            file_3d_urls=file_3d_urls,
            creator_id=current_admin.id,
            is_approved=True,
            category=product.category,
            filament_type=product.filament_type,
            color=product.color
        )
        db.add(new_design)
        db.flush()
        design_id = new_design.id

    db_product = Product(**product_data)
    db_product.image_urls = image_urls
    db_product.image_url = image_url
    db_product.design_id = design_id
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return product_to_response(db_product)


@router.put("/admin/products/{id}", response_model=ProductResponse)
def update_product(id: int, product: ProductUpdate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Var olan bir ürünü günceller (Sadece admin)."""
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    update_data = product.model_dump(exclude_unset=True)
    update_data = normalize_image_fields(update_data)

    image_payload = {
        k: update_data.pop(k)
        for k in ("image_urls", "image_url")
        if k in update_data
    }

    if "file_3d_urls" in update_data:
        file_3d_urls = update_data.pop("file_3d_urls")
        if db_product.design_id:
            from app.models.design import Design
            design = db.query(Design).filter(Design.id == db_product.design_id).first()
            if design:
                design.file_3d_urls = file_3d_urls
        elif file_3d_urls:
            from app.models.design import Design
            new_design = Design(
                title=db_product.title,
                description=db_product.description,
                suggested_price=db_product.price,
                image_urls=db_product.image_urls,
                file_3d_urls=file_3d_urls,
                creator_id=current_admin.id,
                is_approved=True,
                category=db_product.category,
                filament_type=db_product.filament_type,
                color=db_product.color
            )
            db.add(new_design)
            db.flush()
            db_product.design_id = new_design.id

    # Find removed images to delete from Supabase
    if "image_urls" in image_payload:
        old_images = set(db_product.image_urls or [])
        new_images = set(image_payload["image_urls"] or [])
        removed_images = list(old_images - new_images)
        if removed_images:
            try:
                from app.core.supabase_utils import delete_supabase_files
                delete_supabase_files("product-images", removed_images)
            except Exception as e:
                print(f"Failed to delete removed images from Supabase: {e}")

    for key, value in update_data.items():
        setattr(db_product, key, value)

    if image_payload:
        apply_image_fields(db_product, image_payload)

    db.commit()
    db.refresh(db_product)
    return product_to_response(db_product)


@router.delete("/admin/products/{id}")
def delete_product(id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Aktif ürünü pasife alır, zaten pasif olan ürünü kalıcı olarak siler."""
    db_product = db.query(Product).filter(Product.id == id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    if db_product.is_active:
        db_product.is_active = False
        db.commit()
        return {"message": "Ürün başarıyla pasife alındı"}
    else:
        # Product is passive, delete permanently
        try:
            from app.core.supabase_utils import delete_supabase_files
            if db_product.image_urls:
                delete_supabase_files("product-images", db_product.image_urls)
            # Find associated design to delete STLs
            if db_product.design_id:
                from app.models.design import Design
                design = db.query(Design).filter(Design.id == db_product.design_id).first()
                if design and design.file_3d_urls:
                    delete_supabase_files("product-stls", design.file_3d_urls)
                    # Delete the design record as well to avoid dangling references
                    db.delete(design)
        except Exception as e:
            print(f"Failed to delete product files from Supabase: {e}")

        try:
            db.delete(db_product)
            db.commit()
            return {"message": "Ürün ve ilgili dosyaları kalıcı olarak silindi"}
        except Exception as e:
            db.rollback()
            if "ForeignKeyViolation" in str(e) or "IntegrityError" in str(type(e)):
                raise HTTPException(
                    status_code=400, 
                    detail="Bu ürün aktif siparişlerde veya sepetlerde bulunduğu için kalıcı olarak silinemez, pasif durumda kalması gereklidir."
                )
            raise HTTPException(status_code=500, detail="Ürün silinirken bir hata oluştu: " + str(e))


@router.get("/admin/products", response_model=List[ProductResponse])
def get_all_products(db: Session = Depends(get_db), current_admin = Depends(get_current_admin_user)):
    """Admin için tüm ürünleri (pasif olanlar dahil) listeler."""
    products = db.query(Product).all()
    return [product_to_response(product) for product in products]


# ── Public Endpoints ───────────────────────────────────────────────
@router.get("/products", response_model=List[ProductResponse])
def get_products(search: Optional[str] = None, db: Session = Depends(get_db)):
    """Müşteriler için aktif ürünleri listeler. İsteğe bağlı arama destekler."""
    query = db.query(Product).filter(Product.is_active == True)
    
    print(f"SEARCH PARAM RECEIVED: '{search}'")
    if search:
        from sqlalchemy import or_
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Product.title.ilike(search_term),
                Product.description.ilike(search_term),
                Product.category.ilike(search_term)
            )
        )
        print("SQL QUERY:", str(query))
        
    products = query.all()
    print("RETURNED COUNT:", len(products))
    return [product_to_response(product) for product in products]


@router.get("/products/{id}/similar", response_model=List[ProductResponse])
def get_similar_products(id: int, db: Session = Depends(get_db)):
    """Aynı kategorideki diğer aktif ürünleri döner."""
    product = db.query(Product).filter(Product.id == id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    query = db.query(Product).filter(Product.is_active == True, Product.id != id)
    if product.category:
        query = query.filter(Product.category == product.category)

    return [product_to_response(item) for item in query.order_by(Product.created_at.desc()).limit(4).all()]


@router.get("/products/{id}", response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    """Müşteriler için tek bir ürünün detayını getirir."""
    product = db.query(Product).filter(Product.id == id, Product.is_active == True).first()
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return product_to_response(product)
