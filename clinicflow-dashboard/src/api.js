import axios from 'axios';

// Switching base URL depending on environment
const isProd = process.env.NODE_ENV === 'production';
const API_BASE = isProd
  ? 'https://clinicflow-v75g.onrender.com'   // live backend
  : 'http://localhost:5000';                 // local backend

const API_URL = `${API_BASE}/api`;

// Basic request logging (helps during debugging)
axios.interceptors.request.use((config) => {
  console.log(`[AXIOS] ${config.method?.toUpperCase()} ${config.url}`, config.data || {});
  return config;
});
axios.interceptors.response.use(
  (resp) => {
    console.log(`[AXIOS] <- ${resp.status} ${resp.config.url}`, resp.data);
    return resp;
  },
  (err) => {
    console.log('[AXIOS ERR]', err?.message, err?.response?.status, err?.response?.data);
    return Promise.reject(err);
  }
);

// API endpoints
export const fetchIntakes = async (signal) => {
  const { data } = await axios.get(`${API_URL}/intakes`, { signal });
  return Array.isArray(data) ? data : [];
};

export const setReviewed = async (id, reviewed) => {
  const { data } = await axios.patch(`${API_URL}/intakes/${id}/review`, {
    reviewed,
    reviewedBy: reviewed ? 'Staff' : '',
  });
  return data;
};

export const ping = async () => {
  const { data } = await axios.get(`${API_URL}/ping`);
  return data;
};
