import axios from 'axios';

// Force production backend for release build
const API_BASE = 'https://clinicflow-v75g.onrender.com'; // live backend 
const API_URL = `${API_BASE}/api`;

// for debugging
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

// Send message to the chatbot
const sendMessage = async (message, sessionId) => {
  const { data } = await axios.post(`${API_URL}/chatbot/send`, { message, sessionId });
  return data;
};

// Health check
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
