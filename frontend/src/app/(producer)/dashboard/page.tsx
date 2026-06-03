import Button from "@/components/common/Button";

export default function ProducerDashboard() {
  const pendingOrders = [
    { id: 1, customer: "ahmet@email.com", file: "bracket_v2.stl", date: "2024-01-15", price: "₺35.00" },
    { id: 2, customer: "ayse@email.com", file: "phone_stand.stl", date: "2024-01-15", price: "₺22.50" },
    { id: 3, customer: "mehmet@email.com", file: "gear_assembly.stl", date: "2024-01-14", price: "₺78.00" },
  ];

  const activeJobs = [
    { id: 4, file: "lamp_shade.stl", progress: 65, eta: "2 saat", filament: "PLA" },
    { id: 5, file: "figurine_v3.stl", progress: 30, eta: "4 saat", filament: "PETG" },
  ];

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Üretici <span className="text-gradient">Paneli</span></h1>
            <p className="text-surface-400 mt-1">Siparişlerinizi yönetin ve kazancınızı takip edin.</p>
          </div>
          <Button variant="primary" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            Profili Düzenle
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: "Bakiye", value: "₺2,450.00", icon: "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z", color: "text-accent-400" },
            { label: "Bekleyen Sipariş", value: "3", icon: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-yellow-400" },
            { label: "Aktif İş", value: "2", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z", color: "text-primary-400" },
            { label: "Toplam Teslim", value: "148", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-green-400" },
          ].map((stat) => (
            <div key={stat.label} className="glass-card-hover p-6">
              <div className="flex items-center gap-3 mb-3">
                <svg className={`w-5 h-5 ${stat.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
                <span className="text-sm text-surface-400">{stat.label}</span>
              </div>
              <p className="text-2xl font-display font-bold text-surface-100">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Pending Orders */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold">Bekleyen Siparişler</h2>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                {pendingOrders.length} yeni
              </span>
            </div>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-surface-700/30 border border-surface-700/50 hover:border-surface-600 transition-colors">
                  <div className="flex-1">
                    <p className="font-medium text-surface-200 text-sm">{order.file}</p>
                    <p className="text-xs text-surface-500 mt-1">{order.customer} · {order.date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-accent-400">{order.price}</span>
                    <Button variant="primary" size="sm">Kabul Et</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Jobs */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-display font-semibold">Aktif İşler</h2>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                {activeJobs.length} devam ediyor
              </span>
            </div>
            <div className="space-y-4">
              {activeJobs.map((job) => (
                <div key={job.id} className="p-4 rounded-xl bg-surface-700/30 border border-surface-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-surface-200 text-sm">{job.file}</p>
                      <p className="text-xs text-surface-500 mt-1">{job.filament} · Kalan: {job.eta}</p>
                    </div>
                    <span className="text-sm font-semibold text-primary-400">%{job.progress}</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-500"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
