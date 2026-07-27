import { translateApiMessage } from '../utils/blockchain';

// Em desenvolvimento usa o proxy do Vite (/api/v1) para evitar CORS e "Failed to fetch"
const API_URL = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1');

function getStoredUser() {
  const raw = localStorage.getItem('medchain_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getToken() {
  return getStoredUser()?.access_token || null;
}

function getRefreshToken() {
  return getStoredUser()?.refresh_token || null;
}

function persistTokens(accessToken, refreshToken) {
  const user = getStoredUser();
  if (!user) return;
  const next = {
    ...user,
    access_token: accessToken || user.access_token,
    refresh_token: refreshToken || user.refresh_token,
  };
  localStorage.setItem('medchain_user', JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('medchain:user-updated', { detail: next }));
}

function clearSession() {
  localStorage.removeItem('medchain_user');
  window.dispatchEvent(new CustomEvent('medchain:logout'));
}

async function tryRefreshToken() {
  const refresh = getRefreshToken();
  if (!refresh) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refresh}`,
      },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) return false;
    persistTokens(data.access_token, data.refresh_token);
    return true;
  } catch {
    return false;
  }
}

function formatApiError(data) {
  const detail = data.detail ?? data.message;
  if (!detail) return 'Erro na requisição';
  if (typeof detail === 'string') return translateApiMessage(detail);
  if (Array.isArray(detail)) {
    return detail
      .map((d) => {
        if (typeof d === 'object' && d?.msg) {
          const field = Array.isArray(d.loc) ? d.loc.filter((x) => x !== 'body').join('.') : '';
          const msg = translateApiMessage(d.msg);
          return field ? `${field}: ${msg}` : msg;
        }
        return String(d);
      })
      .filter(Boolean)
      .join('. ') || 'Dados inválidos. Verifique os campos e tente novamente.';
  }
  return typeof detail === 'object' && detail?.msg
    ? translateApiMessage(detail.msg)
    : JSON.stringify(detail);
}

async function request(endpoint, options = {}, retry = true) {
  const url = `${API_URL}${endpoint}`;
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return request(endpoint, options, false);
    clearSession();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = formatApiError(data);
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/** Fetch autenticado com retry de refresh (upload/blob sem Content-Type JSON). */
async function authorizedFetch(endpoint, options = {}, retry = true) {
  const url = `${API_URL}${endpoint}`;
  const token = getToken();
  const headers = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) return authorizedFetch(endpoint, options, false);
    clearSession();
  }
  return res;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export const authApi = {
  login: (email, password) =>
    api.post('/auth/login', { email, password }),

  registerDoctor: (data) =>
    api.post('/auth/register-doctor', {
      full_name: data.full_name,
      email: data.email,
      password: data.password,
      CRM: data.CRM,
      specialty: data.specialty,
    }),

  completeDoctor: (data) =>
    api.post('/auth/complete-doctor', {
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      CRM: data.CRM,
      specialty: data.specialty,
    }),

  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const doctorsApi = {
  list: () => api.get('/doctors/'),
  get: (id) => api.get(`/doctors/${id}/`),
  create: (data) => api.post('/doctors/', data),
  update: (id, data) => api.put(`/doctors/${id}/`, data),
  getDashboardStats: (doctorId) => api.get(`/doctors/${doctorId}/dashboard-stats`),
  getPatients: (doctorId) => api.get(`/doctors/${doctorId}/patients`),
};

export const patientsApi = {
  list: () => api.get('/patients/'),
  get: (uid) => api.get(`/patients/${uid}/`),
  create: (data) => api.post('/patients/', data),
  update: (uid, data) => api.put(`/patients/${uid}/`, data),
};

export const medicalRecordsApi = {
  list: (type, doctorId) => {
    const params = new URLSearchParams();
    if (type) params.set('type', type);
    if (doctorId) params.set('doctor_id', doctorId);
    const query = params.toString();
    return api.get(query ? `/medical-records/?${query}` : '/medical-records/');
  },
  get: (id) => api.get(`/medical-records/${id}/`),
  create: (data) => api.post('/medical-records/', data),
  verify: (id) => api.post(`/medical-records/${id}/verify/`),
};

export const filesApi = {
  listByPatient: (patientUid) => api.get(`/files/by-patient/${patientUid}/`),
  get: (fileId) => api.get(`/files/${fileId}/`),

  fetchContent: async (fileId) => {
    const res = await authorizedFetch(`/files/${fileId}/content/`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(formatApiError(data) || 'Falha ao carregar arquivo');
    }
    return res.blob();
  },

  download: async (fileId, filename) => {
    const blob = await filesApi.fetchContent(fileId);
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || `arquivo-${fileId}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
  },

  upload: async (formData) => {
    const res = await authorizedFetch('/files/upload/', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(formatApiError(data) || 'Upload falhou');
    return data;
  },
};
