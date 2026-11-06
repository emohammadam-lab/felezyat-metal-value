// Felezyaft Unified Python Backend API Client

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000";
const TOKEN_KEY = "felezyaft_auth_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let errorDetail = "خطایی رخ داده است.";
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail || `HTTP error ${res.status}`);
  }

  // Handle empty responses
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return res.text() as any;
}

export interface UserProfile {
  user_id: string;
  full_name: string;
  phone: string;
  national_id: string;
  iban_sheba: string;
  bank_card: string;
  default_address: string;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: string;
  email: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
  profile?: UserProfile;
}

export interface PricingConfig {
  id: number;
  copper_price_usd: number;
  usd_rate: number; // In Rials
  fee_percent: number;
  deduction_percent: number;
  updated_at: string;
}

export interface Shipment {
  id: string;
  seller_id: string;
  expert_id?: string | null;
  scrap_type: string;
  estimated_weight: number;
  purity_percent: number;
  final_weight?: number | null;
  final_purity_percent?: number | null;
  deduction_percent?: number | null;
  photos: string[];
  address: string;
  description?: string;
  estimated_price: number;
  final_price?: number | null;
  status: string;
  expert_notes?: string;
  reject_reason?: string;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  seller_phone?: string;
  seller_email?: string;
}

export interface WalletData {
  balance: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  shipment_id?: string | null;
  withdrawal_id?: string | null;
  amount: number;
  type: string;
  description?: string;
  reference_code?: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  iban_sheba: string;
  status: string;
  admin_note?: string;
  tracking_code?: string;
  created_at: string;
  processed_at?: string | null;
  user_name?: string;
  user_phone?: string;
}

export interface AdminStats {
  total_users: number;
  verified_users: number;
  total_shipments: number;
  pending_expert_shipments: number;
  ready_settle_shipments: number;
  pending_withdrawals: number;
  total_volume_settled: number;
  total_weight_settled: number;
}

export const api = {
  // Base media resolver
  mediaUrl(path?: string): string {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE}${path}`;
  },

  // Auth
  auth: {
    async signup(payload: { email: string; password: string; full_name?: string; phone?: string }) {
      const res = await request<{ access_token: string }>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStoredToken(res.access_token);
      return res;
    },

    async login(payload: { email: string; password: string }) {
      const res = await request<{ access_token: string }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setStoredToken(res.access_token);
      return res;
    },

    async getMe(): Promise<UserData> {
      return request<UserData>("/api/auth/me");
    },

    async changePassword(old_password: string, new_password: string) {
      return request<{ message: string }>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ old_password, new_password }),
      });
    },

    logout() {
      setStoredToken(null);
    },
  },

  // Profile
  profile: {
    async get(): Promise<UserProfile> {
      return request<UserProfile>("/api/profile");
    },
    async update(data: Partial<UserProfile>): Promise<UserProfile> {
      return request<UserProfile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },

  // Pricing
  pricing: {
    async get(): Promise<PricingConfig> {
      return request<PricingConfig>("/api/pricing");
    },
    async update(data: Omit<PricingConfig, "id" | "updated_at">): Promise<PricingConfig> {
      return request<PricingConfig>("/api/pricing", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
  },

  // Shipments
  shipments: {
    async uploadPhoto(file: File): Promise<{ url: string }> {
      const formData = new FormData();
      formData.append("file", file);
      return request<{ url: string }>("/api/shipments/upload", {
        method: "POST",
        body: formData,
      });
    },

    async create(data: {
      scrap_type: string;
      estimated_weight: number;
      purity_percent: number;
      address: string;
      description?: string;
      photos: string[];
    }): Promise<Shipment> {
      return request<Shipment>("/api/shipments", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async list(params?: { status?: string; scrap_type?: string; search?: string }): Promise<Shipment[]> {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.scrap_type) qs.set("scrap_type", params.scrap_type);
      if (params?.search) qs.set("search", params.search);
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return request<Shipment[]>(`/api/shipments${query}`);
    },

    async get(id: string): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}`);
    },

    async offer(id: string, data: { final_purity_percent: number; deduction_percent: number; expert_notes?: string }): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}/offer`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async sellerApprove(id: string): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}/seller-approve`, {
        method: "POST",
      });
    },

    async sellerReject(id: string): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}/seller-reject`, {
        method: "POST",
      });
    },

    async cancel(id: string): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}/cancel`, {
        method: "POST",
      });
    },

    async weigh(id: string, data: { final_weight: number; expert_notes?: string }): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}/weigh`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async reject(id: string, reason: string): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
    },

    async settle(id: string): Promise<Shipment> {
      return request<Shipment>(`/api/shipments/${id}/settle`, {
        method: "POST",
      });
    },
  },

  // Wallet
  wallet: {
    async get(): Promise<WalletData> {
      return request<WalletData>("/api/wallet");
    },

    async getTransactions(user_id?: string): Promise<Transaction[]> {
      const q = user_id ? `?user_id=${user_id}` : "";
      return request<Transaction[]>(`/api/wallet/transactions${q}`);
    },

    async requestWithdrawal(data: { amount: number; iban_sheba: string }): Promise<WithdrawalRequest> {
      return request<WithdrawalRequest>("/api/wallet/withdrawals", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async listWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
      const q = status ? `?status=${status}` : "";
      return request<WithdrawalRequest[]>(`/api/wallet/withdrawals${q}`);
    },

    async processWithdrawal(id: string, data: { status: "approved" | "rejected"; tracking_code?: string; admin_note?: string }): Promise<WithdrawalRequest> {
      return request<WithdrawalRequest>(`/api/wallet/withdrawals/${id}/process`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async adjust(data: { user_id: string; amount: number; description: string }) {
      return request<{ message: string; new_balance: number }>("/api/wallet/adjust", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
  },

  // Admin
  admin: {
    async getStats(): Promise<AdminStats> {
      return request<AdminStats>("/api/admin/stats");
    },

    async listUsers(params?: { search?: string; role?: string; verified?: boolean }): Promise<UserData[]> {
      const qs = new URLSearchParams();
      if (params?.search) qs.set("search", params.search);
      if (params?.role) qs.set("role", params.role);
      if (params?.verified !== undefined) qs.set("verified", String(params.verified));
      const query = qs.toString() ? `?${qs.toString()}` : "";
      return request<UserData[]>(`/api/admin/users${query}`);
    },

    async createUser(data: { email: string; password: string; full_name?: string; phone?: string; roles: string[] }): Promise<UserData> {
      return request<UserData>("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },

    async updateUser(id: string, data: Partial<UserProfile> & { is_active?: boolean }): Promise<UserData> {
      return request<UserData>(`/api/admin/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },

    async toggleRole(id: string, role: string): Promise<UserData> {
      return request<UserData>(`/api/admin/users/${id}/roles`, {
        method: "POST",
        body: JSON.stringify({ role }),
      });
    },

    async deleteUser(id: string): Promise<{ message: string }> {
      return request<{ message: string }>(`/api/admin/users/${id}`, {
        method: "DELETE",
      });
    },
  },
};

