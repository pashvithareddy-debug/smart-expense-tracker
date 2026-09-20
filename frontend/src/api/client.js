// API Client for Smart Expense Tracker

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const getToken = () => localStorage.getItem('smart_expense_token');
export const setToken = (token) => localStorage.setItem('smart_expense_token', token);
export const removeToken = () => localStorage.removeItem('smart_expense_token');

export const getUserCache = () => {
  try {
    const raw = localStorage.getItem('smart_expense_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUserCache = (user) => {
  if (user) {
    localStorage.setItem('smart_expense_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('smart_expense_user');
  }
};

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Session expired or invalid
    removeToken();
    setUserCache(null);
    if (!window.location.pathname.includes('/login') && !endpoint.includes('/login')) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.detail || `HTTP Error ${response.status}: ${response.statusText}`;
    throw new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
  }

  return data;
}

export const authAPI = {
  login: async (email, password) => {
    return apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  register: async (name, email, password, currency = '$') => {
    return apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, currency }),
    });
  },
  getMe: async () => {
    return apiFetch('/api/auth/me');
  },
  updateProfile: async (updates) => {
    return apiFetch('/api/auth/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },
};

export const txAPI = {
  list: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return apiFetch(`/api/transactions${qs ? `?${qs}` : ''}`);
  },
  create: async (txData) => {
    return apiFetch('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(txData),
    });
  },
  update: async (id, txData) => {
    return apiFetch(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(txData),
    });
  },
  delete: async (id) => {
    return apiFetch(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  },
  exportCSV: async () => {
    const token = getToken();
    const res = await fetch(`${BASE_URL}/api/transactions/export/csv`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to export CSV');
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
};

export const budgetAPI = {
  list: async () => {
    return apiFetch('/api/budgets');
  },
  set: async (category, monthly_limit) => {
    return apiFetch('/api/budgets', {
      method: 'POST',
      body: JSON.stringify({ category, monthly_limit }),
    });
  },
  update: async (id, monthly_limit) => {
    return apiFetch(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ monthly_limit }),
    });
  },
  delete: async (id) => {
    return apiFetch(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  },
};

export const analyticsAPI = {
  getOverview: async () => {
    return apiFetch('/api/analytics/overview');
  },
  getCashflow: async () => {
    return apiFetch('/api/analytics/cashflow');
  },
  getCategories: async () => {
    return apiFetch('/api/analytics/categories');
  },
  getInsights: async () => {
    return apiFetch('/api/analytics/insights');
  },
};
