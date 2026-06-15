"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, FileText, CheckCircle2 } from "lucide-react";
import SecurePrintControl from "@/components/producer/SecurePrintControl";

function OrderDetailsContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const jobId = searchParams.get("jobId");

  if (!orderId || !jobId) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800">Sipariş Bulunamadı</h2>
        <p className="text-gray-500 mt-2">Geçerli bir Sipariş ID ve Görev ID sağlanmadı.</p>
        <Link href="/dashboard" className="mt-6 inline-block text-orange-500 hover:underline">
          Panele Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Sipariş #{orderId} <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200 font-medium">ÖDENDİ</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Müşteri siparişi başarıyla oluşturuldu ve üretime hazır.</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-8">
        {/* Sol Kolon: Sipariş Bilgileri */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-gray-400" /> Ürün Bilgileri
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Ürün Modeli</span>
                <span className="font-medium text-gray-900 text-sm">Dünya Kupası (Test)</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Malzeme</span>
                <span className="font-medium text-gray-900 text-sm">PLA</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <span className="text-sm text-gray-500">Renk</span>
                <span className="font-medium text-gray-900 text-sm">Neon Orange</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Adet</span>
                <span className="font-bold text-gray-900">1</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-gray-400" /> Talimatlar
            </h3>
            <p className="text-sm text-gray-600 bg-orange-50 p-3 rounded-lg border border-orange-100">
              Bu bir test siparişidir. Yan taraftaki "Yazıcıya Gönder ve Bas" butonuna tıklayarak Güvenli Baskı akışını test edebilirsiniz.
            </p>
          </div>
        </div>

        {/* Sağ Kolon: Secure Print Control */}
        <div className="lg:col-span-2">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-gray-900">Üretim Kontrolü</h2>
            <p className="text-sm text-gray-500">Yazıcınızı hazırlayın ve baskıyı başlatın.</p>
          </div>
          
          <SecurePrintControl 
            jobId={parseInt(jobId)} 
            printerName="Bambu Lab P1S (Mock)" 
          />

          {/* Dummy Steps for UX */}
          <div className="mt-8 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Sipariş Aşamaları</h3>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-gray-900 font-medium">Sipariş Alındı ve Onaylandı</span>
              <span className="text-gray-400 text-xs ml-auto">Bugün, 14:00</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-gray-900 font-medium">Dilimleme Profili Hazırlandı</span>
              <span className="text-gray-400 text-xs ml-auto">Bugün, 14:01</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-5 h-5 rounded-full border-2 border-orange-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-orange-600 font-medium">Baskı Bekleniyor</span>
              <span className="text-gray-400 text-xs ml-auto">Şimdi</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-50">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
              <span className="text-gray-500">Kalite Kontrol ve Paketleme</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-50">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
              <span className="text-gray-500">Kargoya Verildi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProducerOrderPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-center py-20 text-gray-500">Yükleniyor...</div>}>
        <OrderDetailsContent />
      </Suspense>
    </div>
  );
}
