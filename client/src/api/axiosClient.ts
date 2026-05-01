import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosClient = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
});

// Request interceptor — attach access token
axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor — handle 401 + token refresh
let isRefreshing = false;
let failedQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

const processQueue = (error: any, token: string | null) => {
    failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(token)));
    failedQueue = [];
};

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && (original.url?.includes('/auth/login') || original.url?.includes('/auth/register'))) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    original.headers.Authorization = `Bearer ${token}`;
                    return axiosClient(original);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error("No refresh token");

                const { data } = await axios.post(`${API_URL}/api/v1/auth/refresh-token`, { refreshToken });
                const newAccess = data.data.accessToken;
                const newRefresh = data.data.refreshToken;

                localStorage.setItem('accessToken', newAccess);
                localStorage.setItem('refreshToken', newRefresh);

                processQueue(null, newAccess);
                original.headers.Authorization = `Bearer ${newAccess}`;

                return axiosClient(original);
            } catch (err) {
                processQueue(err, null);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.reload();

                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;