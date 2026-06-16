"use client";

import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import api from "@/services/api";
import ProtectedRoute from "@/components/common/ProtectedRoute";
import Button from "@/components/common/Button";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Yeni şifreler eşleşmiyor." });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Yeni şifre en az 6 karakter olmalıdır." });
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: "", text: "" });
      await api.changePassword(oldPassword, newPassword);
      setMessage({ type: "success", text: "Şifreniz başarıyla güncellendi." });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Şifre değiştirilemedi." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8 mt-10">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-8">Ayarlar</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Hesap Bilgileri</h2>
            <p className="text-sm text-gray-500 mt-1">Sisteme kayıtlı hesap bilgileriniz.</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">E-posta Adresi</label>
              <input
                type="text"
                disabled
                value={user?.email || ""}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-lg font-semibold text-gray-900">Şifre Değiştir</h2>
            <p className="text-sm text-gray-500 mt-1">Hesabınızın güvenliği için şifrenizi güçlü tutun.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {message.text && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                message.type === "success" ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
              }`}>
                {message.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mevcut Şifre</label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button type="submit" variant="primary" isLoading={loading}>
                Şifreyi Güncelle
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  );
}
