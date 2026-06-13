import axios from "axios";
import { getDeviceId } from "./device";

// Live URL on Vercel, localhost in dev. Trim any trailing slash so
// `${API_BASE_URL}/meals` never produces `//meals`.
export const API_BASE_URL = (
  import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:10000"
).replace(/\/+$/, "");

// Shared axios instance for the meal-history endpoints. The interceptor attaches
// the anonymous device id to every request, so no caller can forget it.
export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  config.headers["X-Device-Id"] = getDeviceId();
  return config;
});
