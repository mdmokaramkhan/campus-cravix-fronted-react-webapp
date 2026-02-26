import axios, { type AxiosInstance } from "axios";
import { store } from "@/store";
import { logout } from "@/store/slices/authSlice";

const baseURL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "/api" : "/api");

export const api: AxiosInstance = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const { token } = store.getState().auth;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
