import { useState, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, Navigation, MapPin, Star, Calendar, X } from 'lucide-react';
import { formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import type { Court } from '../types';

const vietmapgl = (window as any).vietmapgl;

export default function MapPage() {
    const { setBookingCourt } = useAppStore();
    const [courts, setCourts] = useState<Court[]>([]);
    const [selected, setSelected] = useState<Court | null>(null);
    const [searchVal, setSearchVal] = useState('');

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any | null>(null);

    const VIETMAP_KEY = import.meta.env.VITE_VIETMAP_KEY;

    // 1. HÀM FETCH DỮ LIỆU SÂN
    const fetchCourts = async (lat?: number, lng?: number) => {
        try {
            const res = await courtApi.searchCourts({
                limit: 50,
                lat,
                lng,
                sortBy: lat && lng ? 'distance' : undefined
            });
            if (res.data?.data) {
                setCourts(res.data.data);
            }
        } catch (error) {
            console.error("Lỗi lấy dữ liệu sân trên map:", error);
        }
    };

    useEffect(() => {
        fetchCourts();
    }, []);

    // 2. KHỞI TẠO BẢN ĐỒ VIETMAP
    useEffect(() => {
        if (!mapContainer.current || !VIETMAP_KEY) return;

        if (!map.current) {
            map.current = new vietmapgl.Map({
                container: mapContainer.current,
                style: `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=${VIETMAP_KEY}`,
                center: [106.660172, 10.762622],
                zoom: 12.5,
                pitch: 45,
            });

            map.current.addControl(new vietmapgl.NavigationControl(), 'bottom-left');
            map.current.on('click', () => setSelected(null));
        }

        // Xóa marker cũ trước khi vẽ lại
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];

        courts.forEach(court => {
            const lng = (court.location as any)?.coordinates?.[0] || court.location?.lng;
            const lat = (court.location as any)?.coordinates?.[1] || court.location?.lat;

            if (typeof lng !== 'number' || typeof lat !== 'number') return;

            const price = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0;
            const priceText = price > 0 ? `${Math.round(price / 1000)}K` : '??K';

            const isActive = selected?._id === court._id;

            const el = document.createElement('div');
            el.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.2s; transform: ${isActive ? 'scale(1.1)' : 'scale(1)'}; z-index: ${isActive ? 10 : 1};">
                    <div style="background: ${isActive ? '#10b981' : '#1e1e1e'}; color: ${isActive ? '#000' : '#fff'}; border: 1px solid ${isActive ? '#10b981' : '#333'}; border-radius: 8px; padding: 4px 8px; font-size: 11px; font-weight: bold; margin-bottom: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); white-space: nowrap;">
                        ${priceText}
                    </div>
                    <div style="width: 10px; height: 10px; background: ${isActive ? '#10b981' : '#10b98180'}; border-radius: 50%; border: 2px solid ${isActive ? '#fff' : 'transparent'}; margin: 0 auto; box-shadow: ${isActive ? '0 0 10px #10b981' : 'none'};"></div>
                </div>
            `;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelected(court);
                map.current?.flyTo({
                    center: [lng, lat],
                    zoom: 14.5,
                    duration: 1200
                });
            });

            const marker = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat([lng, lat])
                .addTo(map.current!);

            markersRef.current.push(marker);
        });

    }, [courts, selected, VIETMAP_KEY]);

    // 3. NÚT ĐỊNH VỊ
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
                    map.current.flyTo({
                        center: [lng, lat],
                        zoom: 14.5,
                        pitch: 60,
                        duration: 2500,
                        essential: true
                    });

                    if (userMarkerRef.current) userMarkerRef.current.remove();

                    const userEl = document.createElement('div');
                    userEl.innerHTML = `
                        <div style="position: relative; width: 24px; height: 24px;">
                            <div style="position: absolute; inset: 0; background-color: #3b82f6; border-radius: 50%; opacity: 0.5; animation: pingUser 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                            <div style="position: relative; width: 24px; height: 24px; background-color: #2563eb; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>
                        </div>
                        <style>@keyframes pingUser { 75%, 100% { transform: scale(2.5); opacity: 0; } }</style>
                    `;

                    userMarkerRef.current = new vietmapgl.Marker({ element: userEl, anchor: 'center' })
                        .setLngLat([lng, lat])
                        .addTo(map.current);

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

    if (!VIETMAP_KEY) {
        return <div className="h-full flex items-center justify-center text-emerald-500 font-bold bg-[#121212]">Thiếu VITE_VIETMAP_KEY trong file .env của client!</div>;
    }

    return (
        <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden font-sans">
            {/* 1. CONTAINER BẢN ĐỒ */}
            <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} className="bg-[#121212]" />

            {/* 2. HIỆU ỨNG VIGNETTE */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-[#121212]/90 via-[#121212]/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-[#121212] via-[#121212]/80 to-transparent z-10 pointer-events-none" />

            {/* 3. KHU VỰC TÌM KIẾM & FILTER */}
            <div className="absolute top-6 left-4 right-4 z-20 pointer-events-none">
                <div className="relative max-w-md mx-auto pointer-events-auto group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-emerald-400 transition-colors" />
                    <input
                        type="text"
                        placeholder="Tìm sân trên bản đồ..."
                        value={searchVal}
                        onChange={(e) => setSearchVal((e.target as HTMLInputElement).value)}
                        className="w-full h-14 pl-12 pr-14 rounded-2xl bg-[#1e1e1e]/70 backdrop-blur-2xl border border-white/10 text-white placeholder:text-gray-500 text-[15px] outline-none shadow-[0_8px_30px_rgb(0,0,0,0.5)] focus:border-emerald-500/50 focus:bg-[#1e1e1e]/90 transition-all"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors border border-white/5">
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-w-md mx-auto mt-4 flex gap-2.5 overflow-x-auto hide-scrollbar pointer-events-auto snap-x pb-2">
                    {['Cầu lông', 'Pickleball', 'Gần tôi', 'Giá rẻ', 'Đánh giá cao'].map((tag, idx) => (
                        <button
                            key={idx}
                            className="snap-start shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full bg-[#1e1e1e]/80 backdrop-blur-xl border border-white/10 text-[12px] font-medium text-gray-300 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all duration-300"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* 4. NÚT "SÂN GẦN TÔI" */}
            <button
                onClick={handleLocateMe}
                // DÙNG CHUẨN TAILWIND: bottom-64 (16rem), bottom-96 (24rem)
                className={`absolute right-4 z-20 px-4 py-3.5 rounded-full bg-emerald-500 text-black text-sm font-bold flex items-center gap-2.5 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:scale-105 transition-all duration-300 active:scale-95 ${selected ? 'bottom-96 md:bottom-80' : 'bottom-64 md:bottom-48'
                    }`}
            >
                <Navigation className="w-4 h-4" /> Sân gần tôi
            </button>

            {/* 5. DANH SÁCH CAROUSEL CÁC SÂN */}
            {!selected && courts.length > 0 && (
                // DÙNG CHUẨN TAILWIND: bottom-28 (7rem ~ 112px) để thoát Bottom Nav
                <div className="absolute bottom-28 md:bottom-12 left-0 right-0 z-20 w-full pointer-events-none">
                    <div className="flex overflow-x-auto px-4 pb-4 gap-4 snap-x snap-mandatory hide-scrollbar pointer-events-auto">
                        {courts.slice(0, 6).map((court) => {
                            const lng = (court.location as any)?.coordinates?.[0] || court.location?.lng;
                            const lat = (court.location as any)?.coordinates?.[1] || court.location?.lat;

                            return (
                                <div
                                    key={court._id}
                                    onClick={() => {
                                        setSelected(court);
                                        if (lng && lat) map.current?.flyTo({ center: [lng, lat], zoom: 14.5, duration: 1200 });
                                    }}
                                    className="min-w-75 md:min-w-[320px] snap-center shrink-0 bg-[#1a1a1a]/80 backdrop-blur-2xl rounded-2xl border border-white/10 p-3 shadow-2xl cursor-pointer hover:border-emerald-500/40 hover:bg-[#222]/90 transition-all duration-300 group"
                                >
                                    <div className="flex gap-3.5 items-center">
                                        <img src={mainPhoto(court)} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0 border border-white/5 group-hover:scale-105 transition-transform duration-500" />
                                        <div className="flex-1 min-w-0 py-1">
                                            <h3 className="font-bold text-[15px] text-white truncate group-hover:text-emerald-400 transition-colors">{court.name}</h3>
                                            <p className="text-[13px] text-gray-400 truncate mt-1 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {court.address?.district}
                                            </p>
                                            <div className="flex items-center justify-between mt-2.5">
                                                <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                    {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                                </span>
                                                <span className="text-[12px] font-bold bg-[#2a2a2a] text-amber-400 px-2 py-1 rounded-lg flex items-center gap-1 border border-white/5">
                                                    ⭐ {court.averageRating?.toFixed(1) || '5.0'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 6. POPUP CHI TIẾT */}
            {selected && (
                // DÙNG CHUẨN TAILWIND: bottom-28 giống hệt vị trí của Carousel
                <div className="absolute bottom-28 md:bottom-12 left-4 right-4 md:left-auto md:w-96 z-30 bg-[#1a1a1a]/95 backdrop-blur-2xl rounded-3xl border border-white/10 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.7)] transition-all animate-in fade-in slide-in-from-bottom-8">
                    <button
                        onClick={() => setSelected(null)}
                        className="absolute top-7 right-7 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-red-500 hover:border-red-500 hover:scale-110 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all duration-300 z-10"
                    >
                        <X className="w-4 h-4 stroke-[2.5px]" />
                    </button>

                    <div className="flex flex-col gap-4">
                        <img src={mainPhoto(selected)} alt="" className="w-full h-36 rounded-2xl object-cover shrink-0 border border-white/5" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-[18px] text-white leading-tight">{selected.name}</h3>
                            <p className="text-[13px] text-gray-400 flex items-start gap-1.5 mt-2">
                                <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                                <span className="line-clamp-2">{selected.address?.fullAddress || selected.address.district}</span>
                            </p>

                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/10">
                                <span className="flex items-center gap-1.5 text-sm bg-[#2a2a2a] px-3 py-1.5 rounded-xl border border-white/5">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                    <span className="text-white font-bold">{selected.averageRating?.toFixed(1) || '5.0'}</span>
                                </span>
                                <span className="text-emerald-400 text-[15px] font-black bg-emerald-500/10 px-3 py-1.5 rounded-xl flex-1 text-center border border-emerald-500/20">
                                    {formatPrice(selected.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)} / Giờ
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setBookingCourt(selected)}
                        className="w-full mt-5 py-3.5 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-400 text-black text-[15px] font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_5px_20px_rgba(16,185,129,0.4)] active:scale-[0.98]"
                    >
                        <Calendar className="w-5 h-5" /> Đặt lịch sân này
                    </button>
                </div>
            )}
        </div>
    );
}