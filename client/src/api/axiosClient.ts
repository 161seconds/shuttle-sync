import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosClient = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15000,
    withCredentials: true,
});

// Request interceptor — Không cần lấy Bearer Token từ localStorage nữa, Cookie lo hết
axiosClient.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (e?: any) => void }[] = [];

const processQueue = (error: any = null) => {
    failedQueue.forEach(p => (error ? p.reject(error) : p.resolve(undefined)));
    failedQueue = [];
};

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        // Nếu lỗi 401 lúc đang login/register thì kệ nó, bỏ qua
        if (error.response?.status === 401 && (original.url?.includes('/auth/login') || original.url?.includes('/auth/register'))) {
            return Promise.reject(error);
        }

        // Lỗi 401 ở API khác -> Token hết hạn -> Bắt đầu quá trình Refresh
        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    // Refresh xong, gọi lại request cũ (Axios sẽ tự kẹp Cookie mới)
                    return axiosClient(original);
                }).catch(err => Promise.reject(err));
            }

            original._retry = true;
            isRefreshing = true;

            try {
                await axios.post(`${API_URL}/api/v1/auth/refresh-token`, {}, {
                    withCredentials: true // Bắt buộc để nó gửi kèm cục refreshToken Cookie
                });
                processQueue(null);

                // Gọi lại API ban đầu bị xịt
                return axiosClient(original);
            } catch (err) {
                // Refresh Token cũng hết hạn hoặc lỗi -> Hết cứu -> ra màn hình Đăng nhập
                processQueue(err);
                window.location.href = '/';
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosClient;