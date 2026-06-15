"use client";

import React, { useState, useEffect } from "react";
import { Lock, Printer, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import api from "@/services/api";

interface SecurePrintControlProps {
  jobId: number;
  printerName?: string;
  onStatusChange?: (status: string) => void;
}

interface JobStatusResponse {
  id: number;
  order_id: number;
  printer_id: number;
  printer_name?: string;
  status: string;
  current_layer: number;
  total_layers: number;
  progress_percentage: number;
}

export default function SecurePrintControl({
  jobId,
  printerName,
  onStatusChange,
}: SecurePrintControlProps) {
  const [status, setStatus] = useState<string>("PENDING");
  const [progress, setProgress] = useState<number>(0);
  const [currentLayer, setCurrentLayer] = useState<number>(0);
  const [totalLayers, setTotalLayers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);

  // ── Polling Mekanizması ──────────────────────────────────────────
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const data: JobStatusResponse = await api.getSecurePrintJobStatus(jobId);
        
        setStatus(data.status);
        setProgress(data.progress_percentage);
        setCurrentLayer(data.current_layer);
        setTotalLayers(data.total_layers);
        
        if (onStatusChange) {
          onStatusChange(data.status);
        }

        // Eğer tamamlandıysa veya başarısız olduysa polling'i durdur
        if (data.status === "COMPLETED" || data.status === "FAILED") {
          setIsPolling(false);
        }
      } catch (err: any) {
        console.error("Durum güncellenirken hata oluştu:", err);
      }
    };

    if (isPolling) {
      // İlk sorguyu hemen yap
      pollStatus();
      // Sonra her 5 saniyede bir
      intervalId = setInterval(pollStatus, 5000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, jobId, onStatusChange]);

  // ── Baskıyı Başlat ──────────────────────────────────────────────
  const handleStartPrint = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const res = await api.startSecurePrintJob(jobId);
      setStatus(res.status);
      setIsPolling(true); // Polling'i başlat
    } catch (err: any) {
      setError(err.message || "Baskı başlatılamadı.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Arayüz Durumları ────────────────────────────────────────────
  
  if (status === "COMPLETED") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center animate-fade-in">
        <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-800">Baskı Tamamlandı!</h3>
        <p className="text-green-600 text-sm mt-1">
          Ürün başarıyla basıldı. Müşteriye gönderim aşamasına geçebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Üst Bilgi Çubuğu */}
      <div className="bg-orange-50 border-b border-orange-100 p-4 flex items-start gap-3">
        <div className="bg-orange-100 p-2 rounded-lg">
          <Lock className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="font-medium text-orange-900">🔒 Fikri Mülkiyet Koruması Aktif</h3>
          <p className="text-sm text-orange-700 mt-1">
            Tasarım dosyası bilgisayarınıza indirilmeden, şifreli bulut sunucumuz üzerinden 
            doğrudan yazıcınızın belleğine aktarılarak güvenli bir şekilde basılır.
          </p>
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* PENDING: Başlatma Butonu */}
        {status === "PENDING" && (
          <button
            onClick={handleStartPrint}
            disabled={isLoading}
            className="w-full relative overflow-hidden group bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-medium py-3 px-4 rounded-lg transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
            <span>
              {isLoading ? "Hazırlanıyor..." : `Yazıcıya Gönder ve Bas${printerName ? ` (${printerName})` : ''}`}
            </span>
            {/* Şık parlama efekti */}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        )}

        {/* SLICING / STREAMING / PRINTING: İlerleme Paneli */}
        {["SLICING", "STREAMING", "PRINTING"].includes(status) && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700 flex items-center gap-2">
                {status === "SLICING" && (
                  <><Loader2 className="w-4 h-4 text-orange-500 animate-spin" /> Bulutta Dilimleniyor...</>
                )}
                {status === "STREAMING" && (
                  <><Loader2 className="w-4 h-4 text-orange-500 animate-spin" /> Yazıcıya Akış Sağlanıyor...</>
                )}
                {status === "PRINTING" && (
                  <><Printer className="w-4 h-4 text-orange-500 animate-pulse" /> Canlı Baskı Yapılıyor</>
                )}
              </span>
              <span className="text-gray-500 font-mono">
                {progress.toFixed(1)}%
              </span>
            </div>

            {/* İlerleme Çubuğu (Progress Bar) */}
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all duration-500 ease-out relative"
                style={{ width: `${Math.max(progress, 2)}%` }}
              >
                {/* Stripe animasyonu */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-stripes_1s_linear_infinite]" />
              </div>
            </div>

            {/* Katman Bilgisi (Sadece PRINTING aşamasında daha mantıklı ama genelde hep gösterilebilir) */}
            {(totalLayers > 0 || currentLayer > 0) && (
              <div className="text-right text-xs text-gray-500 font-medium">
                Katman: {currentLayer} {totalLayers > 0 ? `/ ${totalLayers}` : ''}
              </div>
            )}
          </div>
        )}

        {/* FAILED: Hata Durumu (Tekrar Dene) */}
        {status === "FAILED" && (
          <div className="space-y-4 animate-fade-in">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="text-red-800 font-medium text-sm">Baskı işlemi başarısız oldu.</h4>
                <p className="text-red-600 text-xs mt-1">Yazıcı bağlantısı kopmuş olabilir veya API anahtarı geçersiz.</p>
              </div>
            </div>
            <button
              onClick={handleStartPrint}
              disabled={isLoading}
              className="w-full bg-white border-2 border-orange-500 text-orange-600 hover:bg-orange-50 disabled:opacity-50 font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <AlertCircle className="w-5 h-5" />}
              Tekrar Dene
            </button>
          </div>
        )}
      </div>

      {/* Global animasyonlar için stil */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes progress-stripes {
          from { background-position: 1rem 0; }
          to { background-position: 0 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.4s ease-out forwards;
        }
      `}} />
    </div>
  );
}
