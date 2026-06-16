"use client";

import { useState, useEffect, useRef, DragEvent } from "react";
import Button from "@/components/common/Button";
import api from "@/services/api";
import { useAuthStore } from "@/store/useAuthStore";

interface Design {
  id: number;
  creator_id: number;
  title: string;
  description: string | null;
  suggested_price: number;
  royalty_percentage: number;
  image_urls: string[];
  file_3d_url: string | null;
  file_3d_urls: string[];
  is_approved: boolean;
}

interface DesignStats {
  total_designs: number;
  approved: number;
  pending: number;
  total_royalty: number;
}

export default function ProducerDesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [stats, setStats] = useState<DesignStats>({ total_designs: 0, approved: 0, pending: 0, total_royalty: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [suggestedPrice, setSuggestedPrice] = useState("");
  const [category, setCategory] = useState("");
  const [filamentType, setFilamentType] = useState("");
  const [color, setColor] = useState("");

  const CATEGORIES = [
    "Figür & Karakter",
    "Dekoratif Ürünler",
    "Yedek Parça",
    "Maket & Hobi",
    "Aksesuar",
    "Filamentler",
    "Dünya Kupası 2026"
  ];

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [file3dFiles, setFile3dFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const file3dInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

  useEffect(() => {
    fetchDesigns();
    fetchStats();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_URL}/producer/designs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Tasarımlar alınamadı");
      const data = await response.json();
      setDesigns(data);
    } catch (err) {
      console.error("Tasarımlar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(`${API_URL}/producer/designs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("İstatistikler alınamadı");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("İstatistikler yüklenirken hata:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMessage("");

    try {
      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("suggested_price", suggestedPrice || "0");
      formData.append("category", category);
      formData.append("filament_type", filamentType);
      formData.append("color", color);

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      if (file3dFiles.length > 0) {
        file3dFiles.forEach((file) => {
          formData.append("files_3d", file);
        });
      }

      const response = await fetch(`${API_URL}/producer/designs/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Tasarım yüklenemedi");
      }

      setSubmitMessage("Tasarımınız başarıyla yüklendi! Admin onayı bekleniyor.");
      setTitle("");
      setDescription("");
      setSuggestedPrice("");
      setCategory("");
      setFilamentType("");
      setColor("");

      setImageFiles([]);
      setFile3dFiles([]);
      fetchDesigns();
      fetchStats();

      setTimeout(() => {
        setShowForm(false);
        setSubmitMessage("");
      }, 2000);
    } catch (err: any) {
      setSubmitMessage(`Hata: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter((file) => {
        const ext = file.name.split(".").pop()?.toLowerCase();
        return ["stl", "3mf", "obj"].includes(ext || "");
      });
      if (newFiles.length > 0) {
        setFile3dFiles((prev) => [...prev, ...newFiles]);
      } else {
        alert("Lütfen .stl, .3mf veya .obj formatında bir dosya yükleyin.");
      }
    }
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeFile3d = (index: number) => {
    setFile3dFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tasarımlarım</h1>
            <p className="text-gray-500 text-sm mt-1">
              3D tasarımlarınızı yükleyin, onay durumlarını takip edin ve telif payınızı kazanın.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all duration-300 flex items-center gap-2 text-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Yeni Tasarım ve Dosya Yükle
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Toplam Tasarım</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total_designs}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Onaylanan</p>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Onay Bekleyen</p>
            <p className="text-2xl font-bold text-amber-500">{stats.pending}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Toplam Telif</p>
            <p className="text-2xl font-bold text-orange-500">₺{stats.total_royalty.toLocaleString("tr-TR")}</p>
          </div>
        </div>

        {/* Upload Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm mb-8 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Yeni Tasarım Yükle
            </h2>

            {submitMessage && (
              <div
                className={`p-4 rounded-lg text-sm mb-6 border ${
                  submitMessage.startsWith("Hata")
                    ? "bg-red-50 text-red-600 border-red-200"
                    : "bg-green-50 text-green-600 border-green-200"
                }`}
              >
                {submitMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tasarım Adı</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors"
                  placeholder="Örn: Özel Vazo Tasarımı v2"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Açıklama</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors resize-none"
                  placeholder="Tasarımınızı kısaca açıklayın..."
                />
              </div>

              {/* Attributes (Category, Filament, Color) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Kategori *</label>
                  <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-white">
                    <option value="">Seçiniz...</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Filament Türü</label>
                  <select value={filamentType} onChange={(e) => setFilamentType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-white">
                    <option value="">Seçiniz...</option>
                    <option value="PLA">PLA</option>
                    <option value="PETG">PETG</option>
                    <option value="ABS">ABS</option>
                    <option value="TPU">TPU (Esnek)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Renk</label>
                  <select value={color} onChange={(e) => setColor(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-white">
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
              </div>

              {/* Two upload areas side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Product Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ürün Fotoğrafları
                    <span className="text-gray-400 font-normal ml-1">(JPG, PNG)</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center relative ${
                      imageFiles.length > 0
                        ? "border-orange-400 bg-orange-50/10"
                        : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
                    }`}
                  >
                    {imageFiles.length > 0 ? (
                      <>
                        <svg className="w-8 h-8 text-orange-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-orange-600 font-medium">{imageFiles.length} görsel seçildi</p>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center w-full px-2" onClick={(e) => e.stopPropagation()}>
                          {imageFiles.map((file, i) => (
                            <div key={i} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={file.name}
                                className="w-14 h-14 object-cover rounded-lg border border-gray-200 shadow-sm"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeImage(i);
                                }}
                                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500">Tıklayarak görsel seçin</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setImageFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                </div>

                {/* 3D File Drag & Drop */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    3D Tasarım Dosyası
                    <span className="text-gray-400 font-normal ml-1">(.stl, .3mf, .obj)</span>
                  </label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => file3dInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300 min-h-[140px] flex flex-col items-center justify-center relative overflow-hidden ${
                      isDragging
                        ? "border-orange-500 bg-orange-50 scale-[1.02]"
                        : file3dFiles.length > 0
                        ? "border-green-400 bg-green-50/50"
                        : "border-gray-300 hover:border-orange-400 hover:bg-orange-50/50"
                    }`}
                  >
                    {file3dFiles.length > 0 ? (
                      <>
                        <svg className="w-8 h-8 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-green-600 font-medium">{file3dFiles.length} dosya seçildi</p>
                        <div className="flex flex-col gap-1.5 mt-2 max-h-32 overflow-y-auto w-full items-center px-4 relative z-10">
                          {file3dFiles.map((f, i) => (
                            <div key={i} className="text-xs text-gray-700 flex items-center justify-between w-full bg-white px-2.5 py-1.5 rounded-lg border border-gray-100 shadow-sm cursor-default">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <span className="truncate max-w-[180px] font-medium" title={f.name}>{f.name}</span>
                                <span className="text-gray-400 whitespace-nowrap">({(f.size / 1024 / 1024).toFixed(2)} MB)</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFile3d(i);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors ml-2 flex-shrink-0"
                                title="Dosyayı Kaldır"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm text-gray-500 font-medium">Dosyayı sürükleyip bırakın</p>
                        <p className="text-xs text-gray-400 mt-1">veya tıklayarak seçin</p>
                      </>
                    )}

                    {/* Security badge */}
                    <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] text-orange-500 font-medium">3D Tasarım Dosyanız Güvende Şifrelenmektedir</span>
                    </div>
                  </div>
                  <input
                    ref={file3dInputRef}
                    type="file"
                    multiple
                    accept=".stl,.3mf,.obj"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setFile3dFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-md shadow-orange-500/20 transition-all disabled:opacity-50"
                >
                  {submitting ? "Yükleniyor..." : "Tasarımı Gönder"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Designs Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-600 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">Görsel</th>
                  <th className="px-6 py-4 font-semibold">Tasarım Adı</th>
                  <th className="px-6 py-4 font-semibold">Açıklama</th>

                  <th className="px-6 py-4 font-semibold text-center">3D Dosya</th>
                  <th className="px-6 py-4 font-semibold text-center">Durum</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      Yükleniyor...
                    </td>
                  </tr>
                ) : designs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Henüz tasarım yüklemediniz. Hemen ilk tasarımınızı yükleyin!
                    </td>
                  </tr>
                ) : (
                  designs.map((design) => (
                    <tr key={design.id} className="bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        {design.image_urls.length > 0 ? (
                          <img
                            src={`${API_BASE}${design.image_urls[0]}`}
                            alt={design.title}
                            className="w-14 h-14 object-cover rounded-lg border border-gray-200"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{design.title}</td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">{design.description || "—"}</td>

                      <td className="px-6 py-4 text-center">
                        {(design.file_3d_urls && design.file_3d_urls.length > 0) || design.file_3d_url ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Yüklendi ({design.file_3d_urls ? design.file_3d_urls.length : 1})
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            design.is_approved
                              ? "bg-green-100 text-green-700 border border-green-200"
                              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                          }`}
                        >
                          {design.is_approved ? "Onaylandı" : "Onay Bekliyor"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
