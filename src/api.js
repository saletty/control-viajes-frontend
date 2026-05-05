import axios from 'axios';

const api = axios.create({
  baseURL: 'https://defective-cried-maternity.ngrok-free.dev/api'
});

export default api;