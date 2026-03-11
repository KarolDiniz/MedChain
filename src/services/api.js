// Em desenvolvimento usa o proxy do Vite (/api/v1) para evitar CORS e "Failed to fetch"
const API_URL = import.meta.env.DEV ? '/api/v1' : (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1');

function getToken() {
  const user = localStorage.getItem('medchain_user');
  if (user) {
    try {
      const parsed = JSON.parse(user);
      return parsed.access_token;
    } catch {
      return null;
    }
  }
  return null;
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
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

function formatApiError(data) {
  const detail = data.detail ?? data.message;
  if (!detail) return 'Erro na requisição';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (typeof d === 'object' && d?.msg ? `${d.loc?.join?.('.') || ''} ${d.msg}`.trim() : String(d)))
      .filter(Boolean)
      .join('. ') || 'Dados inválidos. Verifique os campos e tente novamente.';
  }
  return typeof detail === 'object' && detail?.msg ? detail.msg : JSON.stringify(detail);
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
};

export const filesApi = {
  upload: (formData) => {
    const token = getToken();
    const url = `${API_URL}/files/upload/`;
    return fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then((r) => (r.ok ? r.json() : Promise.reject(new Error('Upload falhou'))));
  },
};
