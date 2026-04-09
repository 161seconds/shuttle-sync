import { useEffect, useState } from 'react';
import { courtApi } from '../api/court.api';
import type { Court } from '../../../shared/types';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const [courts, setCourts] = useState<Court[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Lấy thông tin user từ LocalStorage để hiện lời chào
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : null;

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const data = await courtApi.getAllCourts();
                setCourts(data);
            } catch (error) {
                console.error('Lỗi khi tải danh sách sân:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourts();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header / Thanh điều hướng */}
            <header className="bg-white shadow">
                <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
                    <h1 className="text-2xl font-bold text-blue-600">🏸 ShuttleSync</h1>
                    <div className="flex items-center space-x-4">
                        {user ? (
                            <>
                                <span className="font-medium text-gray-700">Chào, {user.name}</span>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50"
                                >
                                    Đăng xuất
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => navigate('/login')}
                                className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                            >
                                Đăng nhập
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Nội dung chính: Danh sách sân */}
            <main className="px-6 py-8 mx-auto max-w-7xl">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Danh sách sân hiện có</h2>
                    {user?.role === 'admin' && (
                        <button className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700">
                            + Thêm sân mới
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="text-center text-gray-500 py-10">Đang tải dữ liệu sân...</div>
                ) : courts.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">Hiện chưa có sân nào trong hệ thống.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courts.map((court: any) => (
                            <div key={court._id} className="overflow-hidden bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                                <img
                                    src={court.imageUrl || "https://placehold.co/600x400?text=Badminton+Court"}
                                    alt={court.name}
                                    className="object-cover w-full h-48"
                                />
                                <div className="p-4 space-y-2">
                                    <h3 className="text-lg font-bold text-gray-800">{court.name}</h3>
                                    <p className="text-sm text-gray-600">📍 {court.location}</p>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="font-bold text-blue-600">
                                            {court.pricePerHour.toLocaleString('vi-VN')} VNĐ / giờ
                                        </span>
                                        <button
                                            onClick={() => navigate(`/court/${court._id}`)}
                                            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                                        >
                                            Đặt ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}