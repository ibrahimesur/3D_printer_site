"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Button from "@/components/common/Button";
import api from "@/services/api";

interface Order {
  id: number;
  customer_id: number;
  product_id: number;
  quantity: number;
  status: string;
  total_price: number;
}

export default function ProducerDashboard() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ balance: 0, delivered_count: 0 });

  useEffect(() => {
    fetchPool();
    fetchActiveJobs();
    fetchStats();
  }, []);

  const fetchPool = async () => {
    try {
      setLoading(true);
      const data = await api.getOrderPool() as Order[];
      setPendingOrders(data);
    } catch (err) {
      console.error("Havuz yüklenirken hata oluştu:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveJobs = async () => {
    try {
      const data = await api.getProducerActiveJobs() as Order[];
      const formattedJobs = data.map(order => ({
        id: order.id,
        file: `Sipariş #${order.id} (Ürün: ${order.product_id})`,
        progress: order.status === "printing" ? 50 : 100,
        eta: "Hesaplanıyor",
        filament: "Belirsiz",
      }));
      setActiveJobs(formattedJobs);
    } catch (err) {
      console.error("Aktif işler yüklenirken hata:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.getProducerStats() as any;
      setStats({ balance: data.balance, delivered_count: data.delivered_count });
    } catch (err) {
      console.error("İstatistikler yüklenirken hata:", err);
    }
  };

  const handleClaim = async (orderId: number) => {
    try {
      await api.claimOrder(orderId);
      // Refresh all to reflect changes
      fetchPool();
      fetchActiveJobs();
    } catch (err: any) {
      console.error("İş alınırken hata:", err);
      alert(err.message || "Bu iş alınamadı. Başkası tarafından alınmış olabilir.");
      fetchPool();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-main">Üretici Paneli</h1>
            <p className="text-text-muted text-sm mt-1">Siparişlerinizi yönetin ve kazancınızı takip edin.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/designs">
              <Button variant="primary" size="sm">Tasarımlarım</Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={fetchPool} disabled={loading}>
              {loading ? "Yenileniyor..." : "Yenile"}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-text-muted mb-1">Bakiye</p>
            <p className="text-2xl font-bold text-primary">₺{stats.balance.toLocaleString("tr-TR")}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-text-muted mb-1">Bekleyen</p>
            <p className="text-2xl font-bold text-amber-500">{pendingOrders.length}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-text-muted mb-1">Aktif İş</p>
            <p className="text-2xl font-bold text-primary">{activeJobs.length}</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-text-muted mb-1">Teslim Edilen</p>
            <p className="text-2xl font-bold text-text-main">{stats.delivered_count}</p>
          </div>
        </div>

        {/* Two Column */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Orders */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-text-main">Bekleyen Siparişler</h2>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                {pendingOrders.length} yeni
              </span>
            </div>
            
            <div className="space-y-3">
              {loading && pendingOrders.length === 0 ? (
                <div className="text-center py-6 text-text-muted text-sm">Havuz yükleniyor...</div>
              ) : pendingOrders.length === 0 ? (
                <div className="text-center py-8 bg-background border border-dashed border-border rounded-lg">
                  <p className="text-text-muted text-sm">Şu an uygun iş bulunmuyor.</p>
                </div>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-background border border-border hover:border-primary transition-colors">
                    <div>
                      <p className="font-medium text-text-main text-sm">Sipariş #{order.id}</p>
                      <p className="text-xs text-text-muted mt-1">
                        Ürün: #{order.product_id} · Adet: {order.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-text-main">
                        {order.total_price ? `₺${order.total_price.toFixed(2)}` : 'Fiyat Belirsiz'}
                      </span>
                      <button 
                        onClick={() => handleClaim(order.id)}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                      >
                        İşi Al
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-text-main">Aktif İşler</h2>
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary border border-primary/20">
                {activeJobs.length} devam ediyor
              </span>
            </div>
            
            <div className="space-y-3">
              {activeJobs.length === 0 ? (
                <div className="text-center py-8 bg-background border border-dashed border-border rounded-lg">
                  <p className="text-text-muted text-sm">Aktif işiniz bulunmuyor.</p>
                </div>
              ) : (
                activeJobs.map((job) => (
                  <div key={job.id} className="p-4 rounded-lg bg-background border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium text-text-main text-sm">{job.file}</p>
                        <p className="text-xs text-text-muted mt-1">{job.filament} · Kalan: {job.eta}</p>
                      </div>
                      <span className="text-sm font-bold text-primary">%{job.progress}</span>
                    </div>
                    <div className="w-full h-2.5 bg-background border border-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
