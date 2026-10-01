import { API_URL } from '../config/api.config.js';

class ApiClient {
  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const token = localStorage.getItem('token');

    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const config = {
      ...options,
      headers,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.warn(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error.message);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export const apiService = {
  // Health
  checkHealth: () => apiClient.get('/health'),

  // Authentication
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (data) => apiClient.post('/auth/register', data),
  getMe: () => apiClient.get('/auth/me'),
  logout: () => apiClient.post('/auth/logout', {}),

  // Listings & Marketplace
  getListings: (params = '') => apiClient.get(`/listings${params ? `?${params}` : ''}`),
  getListingById: (id) => apiClient.get(`/listings/${id}`),
  createListing: (data) => apiClient.post('/listings', data),
  reserveListing: (id, lockDurationMinutes = 10) =>
    apiClient.post(`/listings/${id}/reserve`, { lockDurationMinutes }),
  releaseListing: (id) => apiClient.post(`/listings/${id}/release`, {}),

  // Assets
  getAssets: (params = '') => apiClient.get(`/assets${params ? `?${params}` : ''}`),
  getAssetById: (id) => apiClient.get(`/assets/${id}`),
  createAsset: (data) => apiClient.post('/assets', data),
  verifyAsset: (id) => apiClient.post(`/assets/${id}/verify`, {}),

  // Transactions
  initiateTransaction: (listingId) => apiClient.post('/transactions/initiate', { listingId }),
  getMyTransactions: () => apiClient.get('/transactions/my'),
  getTransactionById: (id) => apiClient.get(`/transactions/${id}`),

  // Verification & KYC
  requestVerification: (assetId) => apiClient.post('/verification/request', { assetId }),
  getVerificationStatus: (assetId) => apiClient.get(`/verification/status/${assetId}`),
  getKycStatus: () => apiClient.get('/kyc/status'),
  submitKyc: (data) => apiClient.post('/kyc/submit', data),

  // Admin & Operations
  getAdminMetrics: () => apiClient.get('/admin/metrics'),
  getAdminUsers: (params = '') => apiClient.get(`/admin/users${params ? `?${params}` : ''}`),
  getAdminKycReviews: (params = '') => apiClient.get(`/admin/kyc${params ? `?${params}` : ''}`),
  getAdminFraudAlerts: (params = '') =>
    apiClient.get(`/admin/fraud-alerts${params ? `?${params}` : ''}`),
  getAdminAuditLogs: (params = '') =>
    apiClient.get(`/admin/audit-logs${params ? `?${params}` : ''}`),
};
