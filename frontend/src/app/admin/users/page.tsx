"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";

interface UserData {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserPrinters, setSelectedUserPrinters] = useState<any[]>([]);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [loadingPrinters, setLoadingPrinters] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getAdminUsers() as UserData[];
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

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

  const handleViewPrinters = async (userId: number) => {
    setIsPrinterModalOpen(true);
    setLoadingPrinters(true);
    setSelectedUserPrinters([]);
    try {
      const printers = await api.getAdminUserPrinters(userId) as any[];
      setSelectedUserPrinters(printers);
    } catch (err: any) {
      console.error("Yazıcılar yüklenirken hata:", err);
      alert("Yazıcı bilgileri alınamadı: " + err.message);
    } finally {
      setLoadingPrinters(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sistem Kullanıcıları</h1>
        <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-500">Toplam Kullanıcı: </span>
          <span className="text-lg font-bold text-primary">{users.length}</span>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                E-posta
              </th>
              <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Rol
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
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  #{user.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                      user.role === 'producer' ? 'bg-orange-100 text-orange-800' : 
                      'bg-blue-100 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {user.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.role === 'producer' && (
                    <button
                      onClick={() => handleViewPrinters(user.id)}
                      className="text-orange-600 hover:text-orange-900 font-medium px-3 py-1 bg-orange-50 hover:bg-orange-100 rounded-md transition-colors"
                    >
                      Yazıcıları Gör
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500 text-sm">
                  Sistemde henüz kullanıcı bulunmuyor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Printer Modal */}
      {isPrinterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setIsPrinterModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl w-full ring-1 ring-slate-200">
              <div className="bg-white px-6 pt-6 pb-6 sm:p-8 rounded-t-2xl">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl leading-6 font-bold text-slate-800" id="modal-title">
                    Üreticinin Yazıcıları
                  </h3>
                  <button type="button" onClick={() => setIsPrinterModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {loadingPrinters ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  </div>
                ) : selectedUserPrinters.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    Bu üretici henüz yazıcı eklememiş.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedUserPrinters.map(printer => (
                      <div key={printer.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg">{printer.brand_model}</h4>
                            <p className="text-sm text-slate-500">API: <span className="font-medium text-slate-700">{printer.api_type}</span></p>
                          </div>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${printer.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {printer.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="block text-xs text-slate-500 uppercase font-semibold mb-1">Nozzle</span>
                            <span className="font-medium text-slate-800">{printer.nozzle_diameter} mm</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-slate-200">
                            <span className="block text-xs text-slate-500 uppercase font-semibold mb-1">Bağlantı</span>
                            <span className="font-medium text-slate-800 truncate block" title={printer.api_url}>{printer.api_url}</span>
                          </div>
                        </div>
                        {printer.filament_slots && printer.filament_slots.length > 0 && (
                          <div className="mt-4">
                            <span className="block text-xs text-slate-500 uppercase font-semibold mb-2">Filamentler</span>
                            <div className="flex flex-wrap gap-2">
                              {printer.filament_slots.map((slot: any, i: number) => (
                                <span key={i} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700">
                                  Slot {slot.slot}: {slot.type} - {slot.color} {slot.is_empty ? '(Boş)' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 rounded-b-2xl flex justify-end">
                <button type="button" onClick={() => setIsPrinterModalOpen(false)} className="inline-flex justify-center rounded-xl border border-slate-300 shadow-sm px-6 py-2.5 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm transition-all">
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
