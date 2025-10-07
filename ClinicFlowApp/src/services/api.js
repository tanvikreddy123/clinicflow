import axios from 'axios';

// Switching API base depending on environment
const isProd = process.env.NODE_ENV === 'production';
const API_BASE = isProd
  ? 'https://clinicflow-v75g.onrender.com'   // Render backend (live)
  : 'http://10.0.2.2:5000';                  // Local backend (Android emulator)

const API_URL  = `${API_BASE}/api`;

// Basic request/response logs for debugging
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

// Send message to chatbot
const sendMessage = async (message, sessionId) => {
  const { data } = await axios.post(`${API_URL}/chatbot/send`, { message, sessionId });
  return data;
};

// Ping the backend
const ping = async () => {
  const { data } = await axios.get(`${API_URL}/ping`);
  return data;
};

// Simple echo test
const echo = async (payload) => {
  const { data } = await axios.post(`${API_URL}/echo`, payload);
  return data;
};

export default { sendMessage, ping, echo };
