/**
 * NEUROVAULT — API Service Layer
 * Centralized HTTP client cho tất cả API calls.
 * Handles JWT auth, token refresh, error mapping.
 */

const API_BASE = '/api';

// ──── Token Management ────
let accessToken = localStorage.getItem('neurovault_access_token');
let refreshTokenValue = localStorage.getItem('neurovault_refresh_token');

export const setTokens = (access, refresh) => {
  accessToken = access;
  refreshTokenValue = refresh;
  if (access) localStorage.setItem('neurovault_access_token', access);
  else localStorage.removeItem('neurovault_access_token');
  if (refresh) localStorage.setItem('neurovault_refresh_token', refresh);
  else localStorage.removeItem('neurovault_refresh_token');
};

export const clearTokens = () => {
  accessToken = null;
  refreshTokenValue = null;
  localStorage.removeItem('neurovault_access_token');
  localStorage.removeItem('neurovault_refresh_token');
};

export const getAccessToken = () => accessToken;

// ──── Core Fetch Wrapper ────

async function fetchAPI(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach auth token
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, { ...options, headers });

  // Auto-refresh token on 401
  if (response.status === 401 && refreshTokenValue) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(url, { ...options, headers });
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(errorData.error || `HTTP ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return response.json();
}

async function attemptTokenRefresh() {
  try {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
    });

    if (response.ok) {
      const data = await response.json();
      setTokens(data.accessToken, data.refreshToken);
      return true;
    }
  } catch {
    // Refresh failed
  }
  clearTokens();
  return false;
}

// ──── Auth API ────

export const authAPI = {
  register: (name, email, password) =>
    fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () =>
    fetchAPI('/auth/me'),

  logout: () =>
    fetchAPI('/auth/logout', { method: 'POST' }),
};

// ──── Documents API ────

export const documentsAPI = {
  upload: (file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return fetchAPI('/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  list: (page = 1, limit = 20) =>
    fetchAPI(`/documents?page=${page}&limit=${limit}`),

  get: (id) =>
    fetchAPI(`/documents/${id}`),

  getStatus: (id) =>
    fetchAPI(`/documents/${id}/status`),

  delete: (id) =>
    fetchAPI(`/documents/${id}`, { method: 'DELETE' }),
};
