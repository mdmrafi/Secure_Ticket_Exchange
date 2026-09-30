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
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error.message);
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

  // Assets
  getAssets: (params = '') => apiClient.get(`/assets${params ? `?${params}` : ''}`),
  getAssetById: (id) => apiClient.get(`/assets/${id}`),
  createAsset: (data) => apiClient.post('/assets', data),

  // Listings
  getListings: (params = '') => apiClient.get(`/listings${params ? `?${params}` : ''}`),
  getListingById: (id) => apiClient.get(`/listings/${id}`),
  createListing: (data) => apiClient.post('/listings', data),

  // Transactions
  initiateTransaction: (listingId) => apiClient.post('/transactions/initiate', { listingId }),
  getMyTransactions: () => apiClient.get('/transactions/my'),

  // Verification
  requestVerification: (assetId) => apiClient.post('/verification/request', { assetId }),
  getVerificationStatus: (assetId) => apiClient.get(`/verification/status/${assetId}`),

  // Admin
  getAdminMetrics: () => apiClient.get('/admin/metrics'),
};
