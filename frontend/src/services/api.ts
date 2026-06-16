import { useAuthStore } from "@/store/useAuthStore";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api/v1";

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown;
}

/**
 * Configured fetch instance for communicating with the FastAPI backend.
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): Record<string, string> {
    if (typeof window !== "undefined") {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          const token = parsed?.state?.token;
          if (token) {
            return { Authorization: `Bearer ${token}` };
          }
        }
      } catch (e) {
        // ignore parse error
      }
    }
    return {};
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, body } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          useAuthStore.getState().logout();
        }
      }
      const error = await response.json().catch(() => ({ detail: "Bir hata oluştu" }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ── Auth ──────────────────────────────────────────────────
  async register(email: string, password: string, role: string = "customer") {
    return this.request("/auth/register", {
      method: "POST",
      body: { email, password, role },
    });
  }

  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  async forgotPassword(email: string) {
    return this.request("/auth/forgot-password", {
      method: "POST",
      body: { email },
    });
  }

  async resetPassword(token: string, newPassword: string) {
    return this.request("/auth/reset-password", {
      method: "POST",
      body: { token, new_password: newPassword },
    });
  }

  async changePassword(oldPassword: string, newPassword: string) {
    return this.request("/auth/change-password", {
      method: "POST",
      body: { old_password: oldPassword, new_password: newPassword },
    });
  }

  // ── Orders ───────────────────────────────────────────────
  async checkout(items: any[]) {
    return this.request("/orders/checkout", {
      method: "POST",
      body: { items },
    });
  }

  async getOrderPool() {
    return this.request("/orders/pool");
  }

  async claimOrder(orderId: number) {
    return this.request(`/orders/${orderId}/claim`, {
      method: "POST",
    });
  }

  async getProducerActiveJobs() {
    return this.request("/orders/producer/active");
  }

  async getProducerStats() {
    return this.request("/orders/producer/stats");
  }

  async createOrder(stlFileUrl: string, notes?: string) {
    return this.request("/orders/", {
      method: "POST",
      body: { stl_file_url: stlFileUrl, notes },
    });
  }

  async listOrders() {
    return this.request("/orders/");
  }

  async getOrder(orderId: number) {
    return this.request(`/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: number, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: { status },
    });
  }

  async mockCreateOrder() {
    return this.request("/orders/mock-create", {
      method: "POST",
    });
  }

  // ── Pricing ──────────────────────────────────────────────
  async estimatePrice(stlFileUrl: string, filamentType: string = "PLA", infill: number = 20) {
    return this.request("/pricing/estimate", {
      method: "POST",
      body: {
        stl_file_url: stlFileUrl,
        filament_type: filamentType,
        infill_percentage: infill,
      },
    });
  }

  async listFilaments() {
    return this.request("/pricing/filaments");
  }

  // ── Admin ────────────────────────────────────────────────
  async getAdminUsers() {
    return this.request("/admin/users");
  }

  async getAdminUserPrinters(userId: number) {
    return this.request(`/admin/users/${userId}/printers`);
  }

  async getAdminOrders() {
    return this.request("/admin/orders");
  }

  async reassignAdminOrder(orderId: number, producerId: number | null) {
    return this.request(`/admin/orders/${orderId}/reassign`, {
      method: "PATCH",
      body: { producer_id: producerId },
    });
  }

  async cancelAdminOrder(orderId: number) {
    return this.request(`/admin/orders/${orderId}/cancel`, {
      method: "PATCH",
    });
  }

  async getAdminPendingDesigns() {
    return this.request("/admin/designs/pending");
  }

  async approveAdminDesign(designId: number) {
    return this.request(`/admin/designs/${designId}/approve`, {
      method: "POST",
    });
  }

  async rejectAdminDesign(designId: number) {
    return this.request(`/admin/designs/${designId}/reject`, {
      method: "DELETE",
    });
  }
  // ── Products ─────────────────────────────────────────────
  async getProducts(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : "";
    return this.request(`/products${query}`);
  }

  async getProduct(id: number) {
    return this.request(`/products/${id}`);
  }

  async getAdminProducts() {
    // Admin might need to see inactive ones too if there was an endpoint for it,
    // but for now we'll just use the public one if admin one doesn't exist.
    // Actually wait, I should probably add an admin endpoint to see ALL products.
    // Let's just use /products for now, or assume the backend /products returns all if not filtered.
    // The user requested: "Müşterilerin göreceği genel ürünleri çekmek için public bir GET /api/v1/products endpoint'i yaz (Sadece is_active=True olanları dönsün)."
    // So admin should probably see all. I'll add a quick GET /admin/products in the API too if needed.
    // Let's just use fetch for /admin/products if we added it, or we can just fetch /products for now.
    // Actually, I'll update the backend to have GET /admin/products to return all products.
    return this.request("/admin/products");
  }

  async createProduct(productData: any) {
    return this.request("/admin/products", {
      method: "POST",
      body: productData,
    });
  }

  async updateProduct(id: number, productData: any) {
    return this.request(`/admin/products/${id}`, {
      method: "PUT",
      body: productData,
    });
  }

  async deleteProduct(id: number) {
    return this.request(`/admin/products/${id}`, {
      method: "DELETE",
    });
  }

  async getSimilarProducts(id: number) {
    return this.request(`/products/${id}/similar`);
  }

  async getProductReviews(productId: number) {
    return this.request(`/products/${productId}/reviews`);
  }

  async createProductReview(
    productId: number,
    data: { rating: number; comment?: string }
  ) {
    return this.request(`/products/${productId}/reviews`, {
      method: "POST",
      body: data,
    });
  }

  async getFavorites() {
    return this.request("/favorites");
  }

  async checkFavorite(productId: number) {
    return this.request(`/favorites/check/${productId}`);
  }

  async addFavorite(productId: number) {
    return this.request(`/favorites/${productId}`, { method: "POST" });
  }

  async removeFavorite(productId: number) {
    return this.request(`/favorites/${productId}`, { method: "DELETE" });
  }

  // ── Secure Print Streaming ───────────────────────────────
  async startSecurePrintJob(jobId: number, gcodePath?: string) {
    return this.request(`/producer/jobs/${jobId}/start`, {
      method: "POST",
      body: { gcode_path: gcodePath },
    });
  }

  async getSecurePrintJobStatus(jobId: number) {
    return this.request(`/producer/jobs/${jobId}/status`);
  }

  async setupPrinter(data: any) {
    return this.request("/producer/printers/setup", {
      method: "PUT",
      body: data,
    });
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
