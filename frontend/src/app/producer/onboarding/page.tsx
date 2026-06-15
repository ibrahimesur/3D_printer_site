"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import { Loader2, Check, Printer, Wifi, Palette, Plus, Trash2 } from "lucide-react";
import Button from "@/components/common/Button";

interface FilamentSlot {
  slot: number;
  color: string;
  type: string;
  is_empty: boolean;
}

export default function ProducerOnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [brandModel, setBrandModel] = useState("Bambu Lab P1S");
  const [nozzleDiameter, setNozzleDiameter] = useState<number>(0.4);
  const [apiType, setApiType] = useState("Klipper");
  const [apiUrl, setApiUrl] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [filamentSlots, setFilamentSlots] = useState<FilamentSlot[]>([
    { slot: 1, color: "Siyah", type: "PLA", is_empty: false }
  ]);

  const steps = [
    { num: 1, title: "Donanım", icon: Printer },
    { num: 2, title: "Bağlantı", icon: Wifi },
    { num: 3, title: "Malzeme", icon: Palette },
  ];

  const handleNext = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleAddSlot = () => {
    if (filamentSlots.length >= 4) return;
    setFilamentSlots([
      ...filamentSlots,
      { slot: filamentSlots.length + 1, color: "", type: "PLA", is_empty: false }
    ]);
  };

  const handleRemoveSlot = (index: number) => {
    const newSlots = filamentSlots.filter((_, i) => i !== index);
    // Renumber slots
    setFilamentSlots(newSlots.map((s, i) => ({ ...s, slot: i + 1 })));
  };

  const handleUpdateSlot = (index: number, field: keyof FilamentSlot, value: any) => {
    const newSlots = [...filamentSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setFilamentSlots(newSlots);
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const payload = {
        brand_model: brandModel,
        nozzle_diameter: nozzleDiameter,
        api_type: apiType,
        api_url: apiUrl,
        api_token: apiToken || undefined,
        filament_slots: filamentSlots
      };

      await api.setupPrinter(payload);
      
      // Kurulum başarılı, sipariş paneline yönlendir
      router.push("/producer/orders");
    } catch (err: any) {
      setError(err.message || "Kurulum sırasında bir hata oluştu.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
        
        {/* Başlık ve Stepper */}
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Yazıcı Kurulum Sihirbazı
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Sipariş almaya başlamak için 3D yazıcınızı sisteme entegre edin.
          </p>
        </div>

        <div className="relative pt-6 pb-2">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2 rounded-full"></div>
          <div 
            className="absolute top-1/2 left-0 h-1 bg-orange-500 -z-10 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
          ></div>
          <div className="flex justify-between items-center w-full">
            {steps.map((step) => {
              const isActive = currentStep >= step.num;
              const isCurrent = currentStep === step.num;
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex flex-col items-center">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                      isActive ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-gray-300 text-gray-400"
                    } ${isCurrent ? "ring-4 ring-orange-100" : ""}`}
                  >
                    {isActive && !isCurrent ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${isActive ? "text-orange-600" : "text-gray-400"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Adım İçerikleri */}
        <div className="mt-8 min-h-[300px]">
          {currentStep === 1 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-800">Donanım Bilgileri</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yazıcı Modeli</label>
                <select 
                  value={brandModel}
                  onChange={(e) => setBrandModel(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                >
                  <option value="Bambu Lab P1S">Bambu Lab P1S</option>
                  <option value="Bambu Lab X1C">Bambu Lab X1C</option>
                  <option value="Bambu Lab A1">Bambu Lab A1</option>
                  <option value="Creality Ender 3 V3">Creality Ender 3 V3</option>
                  <option value="Creality K1">Creality K1</option>
                  <option value="Prusa MK4">Prusa MK4</option>
                  <option value="Diğer (Klipper)">Diğer (Klipper Özel Kurulum)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nozzle Çapı (mm)</label>
                <select 
                  value={nozzleDiameter}
                  onChange={(e) => setNozzleDiameter(parseFloat(e.target.value))}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                >
                  <option value={0.2}>0.2 mm (Yüksek Detay)</option>
                  <option value={0.4}>0.4 mm (Standart)</option>
                  <option value={0.6}>0.6 mm (Hızlı Baskı)</option>
                  <option value={0.8}>0.8 mm</option>
                </select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-800">Bağlantı Ayarları</h3>
              <p className="text-sm text-gray-500">
                Güvenli yazdırma akışı için yazıcınızın yerel ağ IP'sini ve API türünü belirtin.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yazıcı API Tipi</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Klipper", "OctoPrint", "BambuLab"].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setApiType(type)}
                      className={`py-2.5 px-3 border rounded-lg text-sm font-medium transition-all ${
                        apiType === type 
                          ? "bg-orange-50 border-orange-500 text-orange-700 ring-1 ring-orange-500" 
                          : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API URL (Yerel IP veya Hostname)</label>
                <input 
                  type="text" 
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="Örn: http://192.168.1.50"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Erişim Anahtarı (Token / API Key)</label>
                <input 
                  type="password" 
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                  placeholder="Şifrelenerek güvenle saklanacaktır"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-shadow"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Filament Slotları</h3>
                <button 
                  onClick={handleAddSlot}
                  disabled={filamentSlots.length >= 4}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" /> Yeni Slot Ekle
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Şu an yazıcınızda takılı olan filamentleri ekleyin. Gelen siparişler bu slotlara göre eşleşecektir.
              </p>

              <div className="space-y-3">
                {filamentSlots.map((slot, index) => (
                  <div key={index} className="flex gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center shrink-0">
                      {slot.slot}
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <input 
                        type="text"
                        value={slot.color}
                        onChange={(e) => handleUpdateSlot(index, "color", e.target.value)}
                        placeholder="Renk (Örn: Neon Turuncu)"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 text-sm"
                      />
                      <select 
                        value={slot.type}
                        onChange={(e) => handleUpdateSlot(index, "type", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-orange-500 text-sm bg-white"
                      >
                        <option value="PLA">PLA</option>
                        <option value="PETG">PETG</option>
                        <option value="ABS">ABS</option>
                        <option value="TPU">TPU (Esnek)</option>
                      </select>
                    </div>
                    <button 
                      onClick={() => handleRemoveSlot(index)}
                      disabled={filamentSlots.length === 1}
                      className="text-red-400 hover:text-red-600 p-2 disabled:opacity-30"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Butonlar */}
        <div className="flex justify-between pt-6 border-t border-gray-100">
          <Button 
            variant="outline" 
            onClick={handlePrev} 
            className={`px-6 ${currentStep === 1 ? 'invisible' : ''}`}
          >
            Geri
          </Button>

          {currentStep < 3 ? (
            <Button 
              variant="primary" 
              onClick={handleNext}
              className="px-8 shadow-md shadow-orange-500/20"
            >
              İleri
            </Button>
          ) : (
            <Button 
              variant="primary" 
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 shadow-md shadow-orange-500/30 flex items-center gap-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoading ? "Kaydediliyor..." : "Kurulumu Tamamla"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
