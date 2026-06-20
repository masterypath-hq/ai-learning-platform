import axios from "axios";

// Single configured axios client shared across the whole app.
// Base URL comes from the environment variable — set it in .env.local once the
// backend team shares the URL (e.g. https://api.masterypath.com).
export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15_000,
});

// REQUEST interceptor — runs before every outgoing call.
// Attach the stored access token as a Bearer header if one exists.
apiClient.interceptors.request.use((config) => {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE interceptor — runs after every response comes back.
// On success: pass the response through unchanged.
// On error: pull out whatever message the backend sent and throw a plain Error
// so every caller gets a consistent `error.message` string to show the user.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.response?.data?.error ??
      error.message ??
      "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);
