"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { supabase } from "@/utils/supabase";
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import getCroppedImg from '@/utils/cropImage';

interface Product {
  id: number;
  title: string;
  description: string | null;
  price: number;
  category: string | null;
  filament_type: string | null;
  image_url: string | null;
  is_active: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    category: "",
    filament_type: "",
    image_url: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Crop state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 50, height: 50, x: 25, y: 25 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isCropping, setIsCropping] = useState(false);

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result as string));
      reader.readAsDataURL(file);
      setCropModalOpen(true);
      if (e.target) e.target.value = '';
    }
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
      
      setFormData(prev => ({ ...prev, image_url: data.publicUrl }));
      setImageToCrop(null);
    } catch (error: any) {
      alert("Resim yüklenirken hata: " + error.message);
    } finally {
      setIsCropping(false);
      setUploadingImage(false);
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
      setProducts(data);
    } catch (err) {
      console.error("Ürünler yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        title: product.title,
        description: product.description || "",
        price: product.price,
        category: product.category || "",
        filament_type: product.filament_type || "",
        image_url: product.image_url || "",
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        price: 0,
        category: "",
        filament_type: "",
        image_url: "",
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : type === "number" ? parseFloat(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, formData);
      } else {
        await api.createProduct(formData);
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
    if (!window.confirm("Bu ürünü pasife almak istediğinize emin misiniz?")) return;
    try {
      await api.deleteProduct(id);
      fetchProducts();
    } catch (err: any) {
      alert("Silinirken hata oluştu: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Ürün Yönetimi</h1>
            <p className="text-sm text-gray-500 mt-1">Sistemdeki tüm ürünleri ekleyin, güncelleyin veya kaldırın.</p>
          </div>
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

        {/* Product Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ürün</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Fiyat</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Kategori / Filament</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Durum</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">İşlemler</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Yükleniyor...</td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Henüz ürün eklenmemiş.</td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-12 w-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex justify-center items-center">
                            {product.image_url ? (
                              <img className="h-12 w-12 object-cover" src={product.image_url} alt="" />
                            ) : (
                              <span className="text-gray-400 text-xs">Görsel</span>
                            )}
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
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openModal(product)} className="text-indigo-600 hover:text-indigo-900 mr-4">Düzenle</button>
                        <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900" disabled={!product.is_active}>
                          Kaldır
                        </button>
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
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900 mb-6" id="modal-title">
                    {editingProduct ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                  </h3>
                  
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
                        <input type="number" step="0.01" name="price" required min="0" value={formData.price} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                        <input type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                      <div className="flex items-center mt-6">
                        <input type="checkbox" name="is_active" id="is_active" checked={formData.is_active} onChange={handleChange} className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded" />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 font-medium">Aktif Ürün</label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Görseli</label>
                      <div className="flex gap-2">
                        <input type="text" name="image_url" placeholder="Görsel URL (veya yandaki butondan yükle)" value={formData.image_url} onChange={handleChange} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500" />
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 flex items-center justify-center transition-colors relative overflow-hidden">
                          {uploadingImage ? "Yükleniyor..." : "Dosya Seç"}
                          <input type="file" accept="image/*" onChange={onFileSelect} disabled={uploadingImage || isCropping} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </label>
                      </div>
                      {formData.image_url && (
                        <div className="mt-3">
                          <img src={formData.image_url} alt="Preview" className="h-24 object-contain rounded-md border border-gray-200" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                  <button type="submit" disabled={saving} className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-orange-500 text-base font-medium text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button type="button" onClick={closeModal} className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
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
                <div className="relative max-h-[60vh] w-full bg-gray-100 rounded-lg overflow-auto flex items-center justify-center border border-gray-200">
                  <ReactCrop
                    crop={crop}
                    onChange={(_, percentCrop) => setCrop(percentCrop)}
                    onComplete={(c) => setCompletedCrop(c)}
                    aspect={3 / 4}
                  >
                    <img src={imageToCrop} onLoad={(e) => setImageRef(e.currentTarget)} alt="Crop me" className="max-h-[60vh] w-auto object-contain" />
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
    </div>
  );
}
