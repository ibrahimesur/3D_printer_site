"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProtectedRoute from "@/components/common/ProtectedRoute";

const navigation = [
  { name: "Genel Bakış", href: "/admin" },
  { name: "Kullanıcılar", href: "/admin/users" },
  { name: "Siparişler", href: "/admin/orders" },
  { name: "Ürünler", href: "/admin/products" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 text-white flex-shrink-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-center h-16 border-b border-gray-800">
              <img src="/PrintAgoLogo.svg" alt="PrintAgo Logo" className="h-8 w-auto" />
            </div>
            
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
