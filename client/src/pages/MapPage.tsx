import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Navigation, MapPin, Star, Calendar, X } from 'lucide-react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { theme as t, formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import type { Court } from '../types';

export default function MapPage() {
    const { setBookingCourt } = useAppStore();
    const [courts, setCourts] = useState<Court[]>([]);
    const [selected, setSelected] = useState<Court | null>(null);
    const [searchVal, setSearchVal] = useState('');

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);
    const userMarkerRef = useRef<maplibregl.Marker | null>(null);

    const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

    // 1. HÀM FETCH DỮ LIỆU SÂN (CÓ THỂ TRUYỀN VỊ TRÍ ĐỂ TÌM SÂN GẦN)
    const fetchCourts = async (lat?: number, lng?: number) => {
        try {
            const res = await courtApi.searchCourts({
                limit: 50,
                lat,
                lng,
                sortBy: lat && lng ? 'distance' : undefined // Nếu có vị trí thì sort theo khoảng cách
            });
            if (res.data?.data) {
                setCourts(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu sân trên map:", error);
        }
    };

    // Load data lần đầu (Không có vị trí)
    useEffect(() => {
        fetchCourts();
    }, []);

    // 2. KHỞI TẠO BẢN ĐỒ VÀ VẼ CÁC MARKER GIÁ TIỀN
    useEffect(() => {
        if (!mapContainer.current || !MAPTILER_KEY) return;

        if (!map.current) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
                center: [106.660172, 10.762622], // Mặc định TP.HCM
                zoom: 12.5,
                pitch: 45, // Góc nghiêng 3D
            });

            // Click vào chỗ trống trên map thì tắt thẻ Detail đi
            map.current.on('click', () => setSelected(null));
        }

        // Xóa các cây kim cũ khi data thay đổi
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        courts.forEach(court => {
            // 🚨 ĐÃ SỬA: Kiểm tra lat, lng thay vì mảng coordinates
            if (!court.location || typeof court.location.lat !== 'number' || typeof court.location.lng !== 'number') return;

            const price = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0;
            const priceText = price > 0 ? `${Math.round(price / 1000)}K` : '??K';

            const isActive = selected?._id === court._id;

            // HTML Custom Marker
            const el = document.createElement('div');
            el.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.2s; transform: ${isActive ? 'scale(1.1)' : 'scale(1)'}; z-index: ${isActive ? 10 : 1};">
                    <div style="background: ${isActive ? '#10b981' : '#1e1e1e'}; color: ${isActive ? '#000' : '#fff'}; border: 1px solid ${isActive ? '#10b981' : '#333'}; border-radius: 8px; padding: 4px 8px; font-size: 11px; font-weight: bold; margin-bottom: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); white-space: nowrap;">
                        ${priceText}
                    </div>
                    <div style="width: 10px; height: 10px; background: ${isActive ? '#10b981' : '#10b98180'}; border-radius: 50%; border: 2px solid ${isActive ? '#fff' : 'transparent'}; margin: 0 auto; box-shadow: ${isActive ? '0 0 10px #10b981' : 'none'};"></div>
                </div>
            `;

            // Bấm vào Marker thì chọn sân và bay camera tới đó
            el.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn sự kiện click lan ra map
                setSelected(court);
                map.current?.flyTo({
                    // 🚨 ĐÃ SỬA: Dùng court.location.lng và court.location.lat
                    center: [court.location.lng, court.location.lat],
                    zoom: 14.5,
                    duration: 1200
                });
            });

            const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
                // 🚨 ĐÃ SỬA: Dùng court.location.lng và court.location.lat
                .setLngLat([court.location.lng, court.location.lat])
                .addTo(map.current!);

            markersRef.current.push(marker);
        });

    }, [courts, selected, MAPTILER_KEY]);

    // 3. XỬ LÝ NÚT "SÂN GẦN TÔI"
    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert("Trình duyệt không hỗ trợ định vị");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;

                if (map.current) {
                    // Bay camera mượt mà
                    map.current.flyTo({
                        center: [lng, lat],
                        zoom: 14.5,
                        pitch: 60, // Cụp góc máy quay xuống
                        duration: 2500, // Bay trong 2.5s
                        essential: true
                    });

                    // Xóa chấm user cũ (nếu có)
                    if (userMarkerRef.current) userMarkerRef.current.remove();

                    // Vẽ chấm xanh dương nhấp nháy cho vị trí User
                    const userEl = document.createElement('div');
                    userEl.innerHTML = `
                        <div style="position: relative; width: 24px; height: 24px;">
                            <div style="position: absolute; inset: 0; background-color: #3b82f6; border-radius: 50%; opacity: 0.5; animation: pingUser 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                            <div style="position: relative; width: 24px; height: 24px; background-color: #2563eb; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>
                        </div>
                        <style>@keyframes pingUser { 75%, 100% { transform: scale(2.5); opacity: 0; } }</style>
                    `;

                    userMarkerRef.current = new maplibregl.Marker({ element: userEl, anchor: 'center' })
                        .setLngLat([lng, lat])
                        .addTo(map.current);

                    // GỌI LẠI API ĐỂ LẤY CÁC SÂN GẦN VỊ TRÍ NÀY NHẤT
                    fetchCourts(lat, lng);
                }
            },
            (err) => {
                console.warn(err);
                alert("Vui lòng cho phép quyền truy cập vị trí trên trình duyệt!");
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    const mainPhoto = (c: Court) =>
        c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    if (!MAPTILER_KEY) {
        return <div className="h-full flex items-center justify-center text-emerald-500">Thiếu MAPTILER_KEY trong file .env</div>;
    }

    return (
        <div className="relative h-[calc(100vh-3.5rem-4rem)] md:h-[calc(100vh-3.5rem)] overflow-hidden">
            {/* 🗺️ BẢN ĐỒ THẬT */}
            <div ref={mapContainer} className="absolute inset-0 bg-[#121212]" />

            {/* 🔍 SEARCH BAR & QUICK FILTERS */}
            <div className="absolute top-4 left-4 right-4 z-20 pointer-events-none">
                <div className="relative max-w-md mx-auto pointer-events-auto">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${t.text.muted}`} />
                    <input
                        type="text"
                        placeholder="Tìm sân trên bản đồ..."
                        value={searchVal}
                        onChange={(e) => setSearchVal((e.target as HTMLInputElement).value)}
                        className={`w-full h-12 pl-11 pr-12 rounded-2xl ${t.bg.card}/95 backdrop-blur-xl border ${t.border.subtle} ${t.text.primary} placeholder:text-[#555] text-sm outline-none shadow-2xl`}
                    />
                    <button className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl ${t.bg.elevated} flex items-center justify-center ${t.text.muted}`}>
                        <SlidersHorizontal className="w-4 h-4" />
                    </button>
                </div>

                {/* 🌟 NÚT LỌC NHANH (Nằm dưới thanh tìm kiếm) */}
                <div className="max-w-md mx-auto mt-3 flex gap-2 overflow-x-auto hide-scrollbar pointer-events-auto snap-x">
                    {['Cầu lông', 'Pickleball', 'Gần tôi', 'Giá rẻ', 'Đánh giá cao'].map((tag, idx) => (
                        <button key={idx} className={`snap-start shrink-0 px-3 py-1.5 rounded-full ${t.bg.card}/90 backdrop-blur-md border ${t.border.subtle} text-xs font-medium ${t.text.secondary} hover:bg-emerald-500 hover:text-black transition-colors shadow-lg`}>
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* 🎯 NÚT SÂN GẦN TÔI */}
            <button
                onClick={handleLocateMe}
                className={`absolute right-4 z-20 px-4 py-3 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center gap-2 shadow-xl ${t.glow.md} hover:bg-emerald-400 transition-all duration-300 active:scale-95 ${selected
                    ? 'bottom-70 md:bottom-67.5'
                    : 'bottom-52.5 md:bottom-52.5'
                    }`}
            >
                <Navigation className="w-4 h-4" /> Sân gần tôi
            </button>

            {/* 📸 CAROUSEL SÂN GỢI Ý (Hiện khi CHƯA CHỌN sân nào) */}
            {!selected && courts.length > 0 && (
                <div className="absolute bottom-30 md:bottom-4 left-0 right-0 z-10 w-full pointer-events-none">
                    <div className="flex overflow-x-auto px-4 pb-4 gap-4 snap-x snap-mandatory hide-scrollbar pointer-events-auto">
                        {courts.slice(0, 6).map((court) => (
                            <div
                                key={court._id}
                                // Bấm vào thẻ này thì camera cũng bay tới sân đó luôn
                                onClick={() => {
                                    setSelected(court);
                                    map.current?.flyTo({ center: [court.location.lng, court.location.lat], zoom: 14.5, duration: 1200 });
                                }}
                                className={`min-w-65 md:min-w-75 snap-center shrink-0 ${t.bg.card}/95 backdrop-blur-md rounded-xl border ${t.border.subtle} p-2.5 shadow-xl cursor-pointer hover:border-emerald-500/50 transition-colors`}
                            >
                                <div className="flex gap-3 items-center">
                                    <img src={mainPhoto(court)} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 border border-[#333]" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{court.name}</h3>
                                        <p className={`text-xs ${t.text.muted} truncate mt-0.5`}>{court.address?.district}</p>
                                        <div className="flex items-center justify-between mt-1.5">
                                            <span className="text-emerald-400 font-bold text-sm">
                                                {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                            </span>
                                            <span className="text-xs font-semibold bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                ⭐ {court.averageRating?.toFixed(1) || '5.0'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 📄 THẺ THÔNG TIN SÂN CHI TIẾT (Nổi lên khi CHỌN 1 sân) */}
            {selected && (
                <div className={`absolute bottom-28 md:bottom-24 left-4 right-4 md:left-auto md:w-87.5 z-30 ${t.bg.card}/95 backdrop-blur-xl rounded-2xl border ${t.border.subtle} p-4 shadow-2xl transition-all animate-in fade-in slide-in-from-bottom-4`}>                    <button
                    onClick={() => setSelected(null)}
                    className={`absolute top-3 right-3 w-7 h-7 rounded-lg ${t.bg.elevated} flex items-center justify-center ${t.text.muted} hover:text-white transition-colors z-10`}
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                    <div className="flex gap-4">
                        <img src={mainPhoto(selected)} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 border border-[#333]" />
                        <div className="flex-1 min-w-0 pr-4">
                            <h3 className={`font-bold text-sm ${t.text.primary} truncate`}>{selected.name}</h3>
                            <p className={`text-xs ${t.text.muted} flex items-center gap-1 mt-1 truncate`}>
                                <MapPin className="w-3 h-3 shrink-0" /> <span className="truncate">{selected.address?.fullAddress || selected.address.district}</span>
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="flex items-center gap-1 text-xs">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className={`${t.text.primary} font-medium`}>{selected.averageRating?.toFixed(1) || '5.0'}</span>
                                </span>
                                <span className="text-emerald-400 text-sm font-black bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    {formatPrice(selected.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setBookingCourt(selected)}
                        className="w-full mt-4 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                        <Calendar className="w-4 h-4" /> Đặt sân này
                    </button>
                </div>
            )}
        </div>
    );
}
