const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('tartila_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const headers = isFormData ? {} : { 'Content-Type': 'application/json', ...options.headers };
  if (!isFormData) Object.assign(headers, options.headers);
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  verify: (token) => request(`/auth/verify?token=${token}`),
};

// ── Books ─────────────────────────────────────────────────────────────────────

export const booksApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.genre && params.genre !== 'All') qs.set('genre', params.genre);
    if (params.featured !== undefined) qs.set('featured', params.featured);
    if (params.is_template !== undefined) qs.set('is_template', params.is_template);
    return request(`/books${qs.toString() ? `?${qs}` : ''}`);
  },
  genres: () => request('/books/genres'),
  get: (id) => request(`/books/${id}`),
  create: (body) => request('/books', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/books/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/books/${id}`, { method: 'DELETE' }),
};

// ── Authors ───────────────────────────────────────────────────────────────────

export const authorsApi = {
  list: () => request('/authors'),
  listAll: () => request('/authors/all'),
  get: (id) => request(`/authors/${id}`),
  create: (body) => request('/authors', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/authors/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/authors/${id}`, { method: 'DELETE' }),
  verify: (id) => request(`/authors/${id}/verify`, { method: 'PATCH' }),
  unverify: (id) => request(`/authors/${id}/unverify`, { method: 'PATCH' }),
  // Writer-specific endpoints
  me: () => request('/authors/me'),
  updateMe: (body) => request('/authors/me', { method: 'PATCH', body: JSON.stringify(body) }),
  listWriters: () => request('/authors/writers'),
  deleteWriter: (id) => request(`/authors/${id}`, { method: 'DELETE' }),
};

// ── Uploads ───────────────────────────────────────────────────────────────────

export const uploadsApi = {
  uploadImage: async (file) => {
    const token = getToken();
    const body = new FormData();
    body.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/uploads/image`, { method: 'POST', headers, body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload failed');
    // Resolve to absolute URL so <img> works from the FE dev server
    const base = BASE_URL.replace('/api', '');
    return { ...data, url: `${base}${data.url}` };
  },

  uploadManuscript: async (file) => {
    const token = getToken();
    const body = new FormData();
    body.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}/uploads/manuscript`, { method: 'POST', headers, body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Upload gagal');
    const base = BASE_URL.replace('/api', '');
    return { ...data, url: `${base}${data.url}` };
  },
};

// ── Packages ──────────────────────────────────────────────────────────────────

export const packagesApi = {
  list: () => request('/packages'),
  get: (id) => request(`/packages/${id}`),
  create: (body) => request('/packages', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/packages/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/packages/${id}`, { method: 'DELETE' }),
};

// ── Genres ────────────────────────────────────────────────────────────────────

export const genresApi = {
  list: () => request('/genres'),
  create: (body) => request('/genres', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/genres/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/genres/${id}`, { method: 'DELETE' }),
};

// ── Bidang ────────────────────────────────────────────────────────────────────

export const bidangApi = {
  list: () => request('/bidang'),
  create: (body) => request('/bidang', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/bidang/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (id) => request(`/bidang/${id}`, { method: 'DELETE' }),
};

// ── Book Chapters ─────────────────────────────────────────────────────────────

export const bookChaptersApi = {
  list: (bookId) => request(`/books/${bookId}/chapters`),
  replace: (bookId, body) => request(`/books/${bookId}/chapters`, { method: 'PUT', body: JSON.stringify(body) }),
};

// ── Writers ───────────────────────────────────────────────────────────────────

export const writersApi = {
  register: (body) => request('/auth/register/writer', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Transactions ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  getConfig: () => request('/transactions/config'),
  list: () => request('/transactions'),
  listMine: () => request('/transactions/mine'),
  create: (body) => request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  uploadManuscript: (txId, file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request(`/transactions/${txId}/upload-manuscript`, { method: 'POST', body: fd });
  },
};

