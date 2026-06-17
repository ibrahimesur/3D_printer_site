"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { getPrimaryProductImage } from '@/lib/productImages';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:8001';

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

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    try {
      setLoading(true);
      // Hem onaylanmış ürünleri hem onay bekleyen tasarımları çek
      const data = await api.getAdminProducts() as Product[];
      let pendingDesigns: Product[] = [];
      try {
        pendingDesigns = await api.getAdminPendingDesigns() as Product[];
      } catch (err) {
        console.error("Bekleyen tasarımlar yüklenirken hata:", err);
      }
      
      const formattedPending = pendingDesigns.map(d => ({
        ...d,
        is_design: true,
        is_active: false,
        category: d.category || "Tasarım",
      }));
      
      const allItems = [...formattedPending, ...data];
      
      // Sadece 3D dosyası olanları filtrele
      const withFiles = allItems.filter(p => p.file_3d_urls && p.file_3d_urls.length > 0);
      
      setDesigns(withFiles);
    } catch (err) {
      console.error("Tasarımlar yüklenirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tasarım Dosyaları</h1>
          <p className="text-slate-500 mt-1">Sistemdeki tüm 3D dosyaları (STL/OBJ) içeren ürünler ve bekleyen tasarımlar.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ürün / Tasarım
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Yükleyen
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  3D Dosyalar
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                    </div>
                    <p className="mt-4">Tasarımlar yükleniyor...</p>
                  </td>
                </tr>
              ) : designs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-sm text-gray-500 bg-gray-50/50">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    Sistemde henüz 3D dosyası yüklenmiş bir ürün veya tasarım bulunmuyor.
                  </td>
                </tr>
              ) : (
                designs.map((product) => (
                  <tr key={`${product.is_design ? 'design' : 'product'}-${product.id}`} className="hover:bg-slate-50 transition-colors">
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
                          <div className="text-xs text-gray-500">ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {product.is_design ? (
                        <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Onay Bekliyor
                        </span>
                      ) : (
                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800`}>
                          Yayında (Ürün)
                        </span>
                      )}
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
                      <div className="flex flex-col gap-2">
                        {product.file_3d_urls!.map((url, idx) => {
                          const filename = url.split('/').pop() || `dosya_${idx + 1}`;
                          const resolved = resolveFileUrl(url);
                          return resolved ? (
                            <a
                              key={idx}
                              href={resolved}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={filename}
                              className="inline-flex w-fit items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              İndir ({filename.substring(0, 15)}...)
                            </a>
                          ) : null;
                        })}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
