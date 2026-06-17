"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { supabase } from "@/utils/supabase";
import ReactCrop, {
  type Crop,
  type PixelCrop,
  centerCrop,
  makeAspectCrop,
  convertToPixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '@/utils/cropImage';
import { getPrimaryProductImage, getProductImages } from '@/lib/productImages';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8001';

/** Relative upload paths → absolute URLs */
function resolveFileUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BACKEND_URL}${url}`;
}

interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  filament_type: string | null;
  color: string | null;
  image_url: string | null;
  image_urls?: string[];
  file_3d_urls?: string[];
  is_active: boolean;
  is_design?: boolean;
  creator_id?: number;
  creator_email?: string;
}

interface ProductFormData {
  title: string;
  description: string;
  price: number | "";
  category: string;
  filament_type: string;
  color: string;
  image_urls: string[];
  file_3d_urls: string[];
  is_active: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("Tümü");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    description: "",
    price: "",
    category: "",
    filament_type: "",
    color: "",
    image_urls: [],
    file_3d_urls: [],
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploading3d, setUploading3d] = useState(false);
  
  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  // Design Preview Modal state
  const [previewDesign, setPreviewDesign] = useState<Product | null>(null);
  const [previewImageIndex, setPreviewImageIndex] = useState(0);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCompletedCrop(null);
      setCrop({ unit: '%', width: 90, height: 90, x: 5, y: 5 });
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result as string));
      reader.readAsDataURL(file);
      setCropModalOpen(true);
      if (e.target) e.target.value = '';
    }
  };

  const onCropImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const percentCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(percentCrop);
    setCompletedCrop(convertToPixelCrop(percentCrop, width, height));
    setImageRef(e.currentTarget);
  };

  const handleCropConfirm = async () => {
    try {
      if (!imageRef || !completedCrop) return;
      setIsCropping(true);
      
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.jpg`;
      const croppedImageBlob = await getCroppedImg(imageRef, completedCrop, fileName);
      if (!croppedImageBlob) throw new Error("Kırpma başarısız oldu");

      setUploadingImage(true);
      setCropModalOpen(false);

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, croppedImageBlob);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
      
      setFormData((prev) => ({
        ...prev,
        image_urls: [...prev.image_urls, data.publicUrl],
      }));
      setImageToCrop(null);
    } catch (error: any) {
      alert("Resim yüklenirken hata: " + error.message);
    } finally {
      setIsCropping(false);
      setUploadingImage(false);
    }
  };

  const on3dFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    try {
      setUploading3d(true);
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-stls')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('product-stls').getPublicUrl(fileName);
      
      setFormData((prev) => ({
        ...prev,
        file_3d_urls: [data.publicUrl], // just keep one 3d file for simplicity
      }));
    } catch (error: any) {
      alert("3D Dosya yüklenirken hata: " + error.message);
    } finally {
      setUploading3d(false);
      if (e.target) e.target.value = '';
    }
  };

  const cancelCrop = () => {
    setCropModalOpen(false);
    setImageToCrop(null);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminProducts() as Product[];
      try {
        const pendingDesigns = await api.getAdminPendingDesigns() as Product[];
        const formattedDesigns = pendingDesigns.map(d => ({
          ...d,
          is_design: true,
          is_active: false,
          category: d.category || "Tasarım",
          filament_type: d.filament_type || null,
          color: d.color || null
        }));
        setProducts([...formattedDesigns, ...data]);
      } catch (err) {
        console.error("Tasarımlar yüklenirken hata:", err);
        setProducts(data);
      }
    } catch (err) {
      console.error("Ürünler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDesign = async (id: number) => {
    if (!window.confirm("Bu tasarımı onaylayıp mağazada ürüne dönüştürmek istediğinize emin misiniz?")) return;
    try {
      await api.approveAdminDesign(id);
      setPreviewDesign(null);
      fetchProducts();
      alert("Tasarım başarıyla onaylandı ve ürünlere eklendi!");
    } catch (err: any) {
      alert("Onaylanırken hata oluştu: " + err.message);
    }
  };

  const handleRejectDesign = async (id: number) => {
    if (!window.confirm("Bu tasarımı reddetmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
    try {
      await api.rejectAdminDesign(id);
      setPreviewDesign(null);
      fetchProducts();
      alert("Tasarım reddedildi.");
    } catch (err: any) {
      alert("Reddedilirken hata oluştu: " + err.message);
    }
  };

  const openDesignPreview = (product: Product) => {
    setPreviewImageIndex(0);
    setPreviewDesign(product);
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description || "",
        price: Number(product.price),
        category: product.category || "",
        filament_type: product.filament_type || "",
        color: product.color || "",
        image_urls: getProductImages(product),
        file_3d_urls: product.file_3d_urls || [],
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        price: "",
        category: "",
        filament_type: "",
        color: "",
        image_urls: [],
        file_3d_urls: [],
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      image_urls: prev.image_urls.filter((_, i) => i !== index),
    }));
  };

  const remove3dFile = () => {
    setFormData((prev) => ({
      ...prev,
      file_3d_urls: [],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
      return;
    }

    if (type === "number") {
      if (value === "") {
        setFormData((prev) => ({ ...prev, [name]: "" }));
        return;
      }
      const parsed = parseFloat(value);
      if (!Number.isNaN(parsed)) {
        setFormData((prev) => ({ ...prev, [name]: parsed }));
      }
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = typeof formData.price === "number" ? formData.price : parseFloat(String(formData.price));
    if (Number.isNaN(price) || price < 0) {
      alert("Geçerli bir fiyat girin.");
      return;
    }

    const payload = {
      title: formData.title,
      description: formData.description,
      price,
      category: formData.category,
      filament_type: formData.filament_type,
      color: formData.color,
      is_active: formData.is_active,
      image_urls: [...formData.image_urls],
      image_url: formData.image_urls[0] || null,
    };

    try {
      setSaving(true);
      let saved: Product;
      if (editingProduct) {
        saved = (await api.updateProduct(editingProduct.id, payload)) as Product;
      } else {
        saved = (await api.createProduct(payload)) as Product;
      }

      const savedCount = getProductImages(saved).length;
      if (savedCount !== payload.image_urls.length) {
        throw new Error(
          `Görseller kaydedilemedi (${savedCount}/${payload.image_urls.length}). Backend yeniden başlatıldı mı?`
        );
      }

      closeModal();
      fetchProducts();
    } catch (err: any) {
      alert(err.message || "Kaydedilirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const product = products.find(p => p.id === id);
    const isPassive = product && !product.is_active;
    const msg = isPassive
      ? "Bu ürün zaten pasif. Kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
      : "Bu ürünü pasife almak istediğinize emin misiniz?";
    if (!window.confirm(msg)) return;
    try {
      await api.deleteProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert("Silinirken hata oluştu: " + err.message);
    }
  };

  const CATEGORIES = [
    "Figür & Karakter",
    "Dekoratif Ürünler",
    "Yedek Parça",
    "Maket & Hobi",
    "Aksesuar",
    "Filamentler",
    "Dünya Kupası 2026"
  ];

  const filteredProducts = categoryFilter === "Tümü" 
    ? products 
    : products.filter(p => p.category === categoryFilter);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-sm text-gray-500 mt-1">Sistemdeki tüm ürünleri ekleyin, güncelleyin veya kaldırın.</p>
          </div>
          <div className="flex items-center gap-4">
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="Tümü">Tüm Kategoriler</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <button
              onClick={() => openModal()}
              className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Yeni Ürün Ekle
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ürün</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiyat</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori / Filament</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Yükleyen</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Yükleniyor...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Bu kategoriye ait ürün bulunmuyor.</td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.is_design ? `design-${product.id}` : `product-${product.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex justify-center items-center">
                            {(() => {
                              const src = product.is_design
                                ? resolveFileUrl((product.image_urls || [])[0])
                                : getPrimaryProductImage(product);
                              return src ? (
                                <img className="h-12 w-12 object-cover" src={src} alt="" />
                              ) : (
                                <span className="text-gray-400 text-xs">Görsel</span>
                              );
                            })()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.title}</div>
                            <div className="text-xs text-gray-500 max-w-[200px] truncate">{product.description || "-"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">₺{product.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category || "-"}</div>
                        <div className="text-xs text-gray-500">{product.filament_type || "-"}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.creator_email || product.creator_id ? (
                            <span className="inline-flex items-center gap-1.5">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {product.creator_email || `Üretici #${product.creator_id}`}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-orange-600 font-medium">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Sistem (Admin)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.is_design ? (
                          <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Onay Bekliyor
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {product.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {product.is_design ? (
                          <div className="flex items-center gap-3 justify-end">
                            <button 
                              onClick={() => openDesignPreview(product)} 
                              className="text-blue-600 hover:text-blue-900 font-medium"
                            >
                              Önizle
                            </button>
                            <button 
                              onClick={() => handleApproveDesign(product.id)} 
                              className="text-green-600 hover:text-green-900 font-bold"
                            >
                              Onayla
                            </button>
                            <button 
                              onClick={() => handleRejectDesign(product.id)} 
                              className="text-red-600 hover:text-red-900 font-bold"
                            >
                              Reddet
                            </button>
                          </div>
                        ) : (
                          <>
                            <button onClick={() => openModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Düzenle</button>
                            <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">
                              Kaldır
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={closeModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full ring-1 ring-slate-200">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-6 pt-6 pb-6 sm:p-8 rounded-t-2xl">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <h3 className="text-xl leading-6 font-bold text-slate-800" id="modal-title">
                      {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                    </h3>
                    <button type="button" onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı *</label>
                      <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                      <textarea name="description" rows={3} value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fiyat (₺) *</label>
                        <input
                          type="number"
                          step="0.01"
                          name="price"
                          required
                          min="0"
                          value={formData.price === "" ? "" : formData.price}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                        <select name="category" required value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white">
                          <option value="">Seçiniz...</option>
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filament Türü</label>
                        <select name="filament_type" value={formData.filament_type} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white">
                          <option value="">Seçiniz...</option>
                          <option value="PLA">PLA</option>
                          <option value="PETG">PETG</option>
                          <option value="ABS">ABS</option>
                          <option value="TPU">TPU (Esnek)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Renk</label>
                        <select name="color" value={formData.color} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 bg-white">
                          <option value="">Seçiniz...</option>
                          <option value="Siyah">Siyah</option>
                          <option value="Beyaz">Beyaz</option>
                          <option value="Gri">Gri</option>
                          <option value="Kırmızı">Kırmızı</option>
                          <option value="Mavi">Mavi</option>
                          <option value="Yeşil">Yeşil</option>
                          <option value="Sarı">Sarı</option>
                          <option value="Turuncu">Turuncu</option>
                          <option value="Pembe">Pembe</option>
                          <option value="Şeffaf">Şeffaf</option>
                          <option value="Çok Renkli">Çok Renkli</option>
                          <option value="Diğer">Diğer</option>
                        </select>
                      </div>
                      <div className="flex items-center mt-6">
                        <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded" />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 font-medium">Aktif Ürün</label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ürün Görselleri
                        <span className="ml-1 text-xs font-normal text-gray-500">
                          ({formData.image_urls.length} görsel)
                        </span>
                      </label>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-orange-200 bg-orange-50 px-4 py-2 text-orange-700 transition-colors hover:bg-orange-100 relative overflow-hidden">
                        {uploadingImage ? "Yükleniyor..." : "Dosya Yükle"}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={onFileSelect}
                          disabled={uploadingImage || isCropping}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                      {formData.image_urls.length > 0 ? (
                        <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                          {formData.image_urls.map((url, index) => (
                            <div key={`${url}-${index}`} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                              <img src={url} alt={`Görsel ${index + 1}`} className="h-24 w-full object-contain" />
                              {index === 0 && (
                                <span className="absolute left-1 top-1 rounded bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                  Kapak
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Görseli kaldır"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-xs text-gray-500">
                          Birden fazla görsel ekleyebilirsiniz. İlk görsel kapak olarak kullanılır.
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-6 border-t border-slate-100 pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        3D Tasarım Dosyası (STL / OBJ)
                      </label>
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 transition-colors hover:bg-slate-50 relative overflow-hidden">
                        {uploading3d ? "Yükleniyor..." : "3D Dosya Seç"}
                        <input
                          type="file"
                          accept=".stl,.obj"
                          onChange={on3dFileSelect}
                          disabled={uploading3d}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                      </label>
                      {formData.file_3d_urls.length > 0 && (
                        <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2 text-sm text-indigo-700 font-medium">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Tasarım Dosyası Yüklendi
                          </div>
                          <button
                            type="button"
                            onClick={remove3dFile}
                            className="text-red-500 hover:text-red-700 p-1 bg-white rounded-md border border-red-100"
                            title="Dosyayı kaldır"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 px-6 py-4 sm:flex sm:flex-row-reverse border-t border-slate-100 rounded-b-2xl">
                  <button
                    type="submit"
                    disabled={saving || uploadingImage || isCropping || cropModalOpen}
                    className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-base font-medium text-white hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm transition-all disabled:opacity-50"
                  >
                    {uploadingImage ? "Görsel yükleniyor..." : saving ? "Kaydediliyor..." : editingProduct ? "Değişiklikleri Kaydet" : "Ürünü Ekle"}
                  </button>
                  <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-6 py-2.5 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-all">
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {cropModalOpen && imageToCrop && (
        <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="crop-modal" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 bg-gray-900 bg-opacity-90 transition-opacity" onClick={cancelCrop}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Resmi Kırp (Köşelerden Çekin)</h3>
                <div className="relative max-h-[60vh] w-full bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 p-2">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={1}
                    className="max-w-full max-h-full flex items-center justify-center"
                  >
                    <img src={imageToCrop} onLoad={onCropImageLoad} alt="Crop me" className="max-h-[55vh] max-w-full object-contain block" style={{ transform: 'translate3d(0,0,0)' }} />
                  </ReactCrop>
                </div>
                <div className="mt-6 flex justify-end items-center">
                  <div className="flex gap-3">
                    <button type="button" onClick={cancelCrop} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">İptal</button>
                    <button type="button" onClick={handleCropConfirm} disabled={isCropping || !completedCrop} className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50">
                      {isCropping ? "İşleniyor..." : "Kes ve Yükle"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Design Preview Modal */}
      {previewDesign && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="preview-modal" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" onClick={() => setPreviewDesign(null)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl w-full">
              {/* Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{previewDesign.title}</h3>
                  <p className="text-orange-100 text-sm mt-0.5">Tasarım Önizleme &mdash; Üretici #{previewDesign.creator_id}</p>
                </div>
                <button onClick={() => setPreviewDesign(null)} className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Description */}
                {previewDesign.description && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Açıklama</h4>
                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed">{previewDesign.description}</p>
                  </div>
                )}

                {/* Price */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Önerilen Fiyat</h4>
                  <p className="text-2xl font-bold text-gray-900">₺{previewDesign.price.toFixed(2)}</p>
                </div>

                {/* Images */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Görseller
                    <span className="ml-2 text-xs font-normal text-gray-400">({(previewDesign.image_urls || []).length} adet)</span>
                  </h4>
                  {(previewDesign.image_urls || []).length > 0 ? (
                    <div>
                      {/* Main image */}
                      <div className="relative bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center" style={{minHeight: 320}}>
                        <img
                          src={resolveFileUrl(previewDesign.image_urls![previewImageIndex]) || ''}
                          alt={`Görsel ${previewImageIndex + 1}`}
                          className="max-h-[400px] max-w-full object-contain"
                        />
                        {previewDesign.image_urls!.length > 1 && (
                          <>
                            <button
                              onClick={() => setPreviewImageIndex((i) => (i - 1 + previewDesign.image_urls!.length) % previewDesign.image_urls!.length)}
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <button
                              onClick={() => setPreviewImageIndex((i) => (i + 1) % previewDesign.image_urls!.length)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                      {/* Thumbnails */}
                      {previewDesign.image_urls!.length > 1 && (
                        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                          {previewDesign.image_urls!.map((url, idx) => (
                            <button
                              key={idx}
                              onClick={() => setPreviewImageIndex(idx)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                idx === previewImageIndex ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:border-gray-400'
                              }`}
                            >
                              <img src={resolveFileUrl(url) || ''} alt="" className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.41a2.25 2.25 0 013.182 0l2.909 2.91m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                      <p className="text-gray-400 text-sm">Görsel yüklenmemiş</p>
                    </div>
                  )}
                </div>

                {/* 3D Files */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    3D Dosyalar
                    <span className="ml-2 text-xs font-normal text-gray-400">({(previewDesign.file_3d_urls || []).length} adet)</span>
                  </h4>
                  {(previewDesign.file_3d_urls || []).length > 0 ? (
                    <div className="space-y-2">
                      {previewDesign.file_3d_urls!.map((url, idx) => {
                        const filename = url.split('/').pop() || `dosya_${idx + 1}`;
                        const resolved = resolveFileUrl(url);
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 transition-colors group"
                          >
                            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{filename}</p>
                              <p className="text-xs text-gray-500">STL / 3D Dosya (Güvenli Depo)</p>
                            </div>
                            {resolved && (
                              <a
                                href={resolved}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={filename}
                                className="ml-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-orange-700 bg-orange-100 hover:bg-orange-200 transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                İndir
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center">
                      <svg className="w-12 h-12 mx-auto text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <p className="text-gray-400 text-sm">3D dosya yüklenmemiş</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200">
                <button
                  onClick={() => handleRejectDesign(previewDesign.id)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-sm"
                >
                  Reddet
                </button>
                <button
                  onClick={() => handleApproveDesign(previewDesign.id)}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors shadow-sm"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
