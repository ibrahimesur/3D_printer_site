const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

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
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", headers = {}, body } = options;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
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

  // ── Orders ───────────────────────────────────────────────
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
}

export const api = new ApiClient(API_BASE_URL);
export default api;
