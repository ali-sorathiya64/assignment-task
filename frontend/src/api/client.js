import axios from "axios";

export const TOKEN_KEY = "joineazy_token";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
    headers: { "Content-Type": "application/json" }
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        const onAuthPage = ["/login", "/register"].includes(
            window.location.pathname
        );

        if (status === 401 && !onAuthPage) {
            localStorage.removeItem(TOKEN_KEY);
            window.location.replace("/login");
        }

        return Promise.reject(error);
    }
);

export const readError = (error, fallback = "Something went wrong.") =>
    error?.response?.data?.message || error?.message || fallback;

export default api;