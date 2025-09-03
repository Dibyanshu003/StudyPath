import axios from "axios";
import { toast } from "react-toastify";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.message;
    if (err?.response?.status === 401) {
      toast.error("Session expired. Please log in.");
    } else if (msg) {
      // surface backend messages
      // toast.error(msg)
    }
    return Promise.reject(err);
  }
);

export default api;
