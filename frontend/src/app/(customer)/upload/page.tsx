"use client";

import React, { useState, useCallback } from "react";
import Button from "@/components/common/Button";

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".stl")) {
      setFile(droppedFile);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30" />
      <div className="absolute top-1/3 -right-48 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[150px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            STL Dosyanızı <span className="text-gradient">Yükleyin</span>
          </h1>
          <p className="text-surface-400 max-w-lg mx-auto">
            3D model dosyanızı sürükleyip bırakın veya dosya seçin. Anında fiyat teklifi alın.
          </p>
        </div>

        {/* Upload Area */}
        <div
          className={`glass-card p-12 text-center cursor-pointer transition-all duration-300 animate-slide-up ${
            isDragging
              ? "border-primary-500 bg-primary-500/5 shadow-lg shadow-primary-500/20"
              : "hover:border-surface-500"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".stl,.3mf,.obj"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="w-20 h-20 mx-auto mb-6 bg-primary-500/10 rounded-2xl flex items-center justify-center border border-primary-500/20">
            <svg className="w-10 h-10 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
          </div>

          {file ? (
            <div>
              <p className="text-lg font-semibold text-surface-100 mb-2">{file.name}</p>
              <p className="text-sm text-surface-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-semibold text-surface-200 mb-2">
                STL dosyanızı sürükleyip bırakın
              </p>
              <p className="text-sm text-surface-500">
                veya dosya seçmek için tıklayın · STL, 3MF, OBJ
              </p>
            </div>
          )}
        </div>

        {/* Options & Price Estimate (placeholder) */}
        {file && (
          <div className="mt-8 glass-card p-8 animate-slide-up">
            <h2 className="text-xl font-display font-semibold mb-6">Baskı Seçenekleri</h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Filament Türü</label>
                <select className="input-field">
                  <option value="PLA">PLA</option>
                  <option value="ABS">ABS</option>
                  <option value="PETG">PETG</option>
                  <option value="TPU">TPU</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">Dolgu Oranı</label>
                <select className="input-field">
                  <option value="20">%20 (Standart)</option>
                  <option value="40">%40 (Güçlü)</option>
                  <option value="60">%60 (Çok Güçlü)</option>
                  <option value="100">%100 (Masif)</option>
                </select>
              </div>
            </div>

            {/* Estimated Price Card */}
            <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-surface-400">Tahmini Fiyat</p>
                  <p className="text-3xl font-display font-bold text-gradient mt-1">₺49.99</p>
                  <p className="text-xs text-surface-500 mt-1">Tahmini süre: 3.5 saat</p>
                </div>
                <Button variant="primary" size="lg">
                  Sipariş Ver
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
