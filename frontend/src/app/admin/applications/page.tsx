"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";

interface Application {
  id: number;
  full_name: string;
  email: string;
  printer_info: string;
  experience: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      // Create a specific api method or just use fetch with auth token
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/applications`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (!response.ok) throw new Error("Başvurular alınamadı");
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id: number, action: "approve" | "reject") => {
    if (!confirm(`Bu başvuruyu ${action === "approve" ? "onaylamak" : "reddetmek"} istediğinize emin misiniz?`)) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/v1/applications/${id}/${action}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      
      if (!response.ok) throw new Error("İşlem başarısız oldu");
      
      // Update UI
      setApplications(applications.map(app => 
        app.id === id ? { ...app, status: action === "approve" ? "approved" : "rejected" } : app
      ));
    } catch (error) {
      alert("Hata oluştu, lütfen tekrar deneyin.");
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Üretici Başvuruları</h1>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-semibold">Ad Soyad</th>
                <th className="px-6 py-4 font-semibold">E-posta</th>
                <th className="px-6 py-4 font-semibold">Yazıcı Bilgisi</th>
                <th className="px-6 py-4 font-semibold">Tecrübe</th>
                <th className="px-6 py-4 font-semibold text-center">Durum</th>
                <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Henüz başvuru bulunmuyor.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {app.full_name}
                    </td>
                    <td className="px-6 py-4">{app.email}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={app.printer_info}>{app.printer_info}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={app.experience}>{app.experience}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        app.status === "approved" ? "bg-green-100 text-green-800" :
                        app.status === "rejected" ? "bg-red-100 text-red-800" :
                        "bg-yellow-100 text-yellow-800"
                      }`}>
                        {app.status === "approved" ? "Onaylandı" :
                         app.status === "rejected" ? "Reddedildi" : "Bekliyor"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      {app.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleAction(app.id, "approve")}
                            className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => handleAction(app.id, "reject")}
                            className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-md transition-colors"
                          >
                            Reddet
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
  );
}
