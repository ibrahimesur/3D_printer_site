"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

interface OrderData {
  id: number;
  total_price: number;
  status: string;
  created_at: string;
  customer_id: number;
  customer_email?: string;
  producer_id: number | null;
  producer_email?: string;
  product_id: number;
  product_title?: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [producers, setProducers] = useState<any[]>([]);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedProducerId, setSelectedProducerId] = useState<number | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [ordersData, usersData] = await Promise.all([
        api.getAdminOrders() as Promise<OrderData[]>,
        api.getAdminUsers() as Promise<any[]>
      ]);
      setOrders(ordersData);
      setProducers(usersData.filter(u => u.role === "producer" && u.is_active));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenReassignModal = (orderId: number, currentProducerId: number | null) => {
    setSelectedOrderId(orderId);
    setSelectedProducerId(currentProducerId || "");
    setReassignModalOpen(true);
  };

  const handleReassign = async (producerId: number | null) => {
    if (!selectedOrderId) return;
    setIsSubmitting(true);
    try {
      await api.reassignAdminOrder(selectedOrderId, producerId);
      await fetchData(); // Refresh list
      setReassignModalOpen(false);
    } catch (err: any) {
      alert("Atama yapılırken hata oluştu: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-500 p-4 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tüm Siparişler</h1>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Toplam Sipariş: </span>
          <span className="text-lg font-bold text-primary">{orders.length}</span>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Sipariş No
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Müşteri / Üretici
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Ürün
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tutar
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{order.id.toString().padStart(4, '0')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleDateString('tr-TR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <div className="font-medium text-slate-800" title={order.customer_email}>
                    Müşteri: {order.customer_email ? order.customer_email.split('@')[0] : `ID ${order.customer_id}`}
                  </div>
                  <div className="text-xs text-orange-600 mt-1 font-medium" title={order.producer_email}>
                    Üretici: {order.producer_id ? (order.producer_email ? order.producer_email.split('@')[0] : `ID ${order.producer_id}`) : 'Havuza Bekliyor'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  <span className="font-medium text-slate-800 max-w-[150px] truncate block" title={order.product_title}>
                    {order.product_title}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  ₺{order.total_price.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'printing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'accepted' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-green-100 text-green-800'}`}>
                    {order.status === 'pending' ? 'Bekliyor' :
                      order.status === 'printing' ? 'Üretimde' :
                        order.status === 'accepted' ? 'Kabul Edildi' : order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleOpenReassignModal(order.id, order.producer_id)}
                    className="text-indigo-600 hover:text-indigo-900 font-medium px-3 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
                  >
                    Atama Yap
                  </button>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                  Sistemde henüz sipariş bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Reassign Modal */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setReassignModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full ring-1 ring-slate-200">
              <div className="bg-white px-6 pt-6 pb-6 sm:p-8 rounded-t-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl leading-6 font-bold text-slate-800" id="modal-title">
                    Sipariş Ataması (İş #{selectedOrderId?.toString().padStart(4, '0')})
                  </h3>
                  <button type="button" onClick={() => setReassignModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Özel Olarak Üretici Seç</label>
                    <select
                      value={selectedProducerId}
                      onChange={(e) => setSelectedProducerId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="">Üretici Seçiniz...</option>
                      {producers.map(p => (
                        <option key={p.id} value={p.id}>{p.email} (ID: {p.id})</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedProducerId || isSubmitting}
                      onClick={() => handleReassign(selectedProducerId as number)}
                      className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                    >
                      Seçili Üreticiye Ata
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                      <div className="w-full border-t border-slate-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="px-2 bg-white text-sm text-slate-500">VEYA</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-3 text-center">Siparişi havuzdan çekip veya mevcut üreticiden alıp tekrar havuza (bekleyenler) bırakabilirsiniz.</p>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => handleReassign(null)}
                      className="w-full bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium py-2 px-4 rounded-lg transition-colors border border-amber-200 disabled:opacity-50"
                    >
                      Havuza Gönder (Atamayı Kaldır)
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 rounded-b-2xl flex justify-end">
                <button type="button" onClick={() => setReassignModalOpen(false)} className="inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-6 py-2.5 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 transition-all">
                  İptal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
