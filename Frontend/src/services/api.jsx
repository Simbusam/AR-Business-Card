import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.REACT_API_URL || 'http://localhost:3005/api/v1',
  withCredentials: true,
});

// Add auth token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;