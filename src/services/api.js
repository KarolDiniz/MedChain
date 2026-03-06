const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api/v1' : 'http://localhost:8000/api/v1');

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
    const err = new Error(data.detail || data.message || 'Erro na requisição');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
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

  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const doctorsApi = {
  list: () => api.get('/doctors/'),
  get: (id) => api.get(`/doctors/${id}/`),
  create: (data) => api.post('/doctors/', data),
  update: (id, data) => api.put(`/doctors/${id}/`, data),
};

export const patientsApi = {
  list: () => api.get('/patients/'),
  get: (uid) => api.get(`/patients/${uid}/`),
  create: (data) => api.post('/patients/', data),
  update: (uid, data) => api.put(`/patients/${uid}/`, data),
};

export const medicalRecordsApi = {
  list: (type) => api.get(type ? `/?type=${type}` : '/medical-records/'),
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
