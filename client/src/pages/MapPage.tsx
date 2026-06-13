import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, SlidersHorizontal, Navigation, MapPin, Star, Calendar, X, Route, Clock, Ruler } from 'lucide-react';
import { formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import type { Court } from '../types';
import { EmojiIcon } from '../components/EmojiIcon';
import { renderToString } from 'react-dom/server';
import { useAlertStore } from '../stores/useAlertStore';

const vietmapgl = (window as any).vietmapgl;

// ═══ HELPERS ═══
function getCourtCoords(court: Court): [number, number] | null {
    const loc = court.location as any;
    if (!loc) return null;
    let lng, lat;
    if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
        lng = parseFloat(loc.coordinates[0]);
        lat = parseFloat(loc.coordinates[1]);
    } else {
        lng = parseFloat(loc.lng);
        lat = parseFloat(loc.lat);
    }
    if (!isNaN(lng) && !isNaN(lat)) return [lng, lat];
    return null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FILTER_CHIPS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'badminton', label: 'Cầu lông' },
    { id: 'pickleball', label: 'Pickleball' },
    { id: 'top_rated', label: 'Đánh giá cao' },
];

export default function MapPage() {
    const { setBookingCourt } = useAppStore();
    const [courts, setCourts] = useState<Court[]>([]);
    const [selected, setSelected] = useState<Court | null>(null);

    const [searchVal, setSearchVal] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
    const [showRoute, setShowRoute] = useState(false);

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any | null>(null);
    const radiusLayerRef = useRef<boolean>(false);

    const VIETMAP_KEY = import.meta.env.VITE_VIETMAP_KEY;

    // ═══ HÀM DỌN DẸP ĐƯỜNG ĐI ═══
    const clearRoute = useCallback(() => {
        if (!map.current) return;
        try {
            if (map.current.getLayer('route-line')) map.current.removeLayer('route-line');
            if (map.current.getLayer('route-outline')) map.current.removeLayer('route-outline');
            if (map.current.getSource('route')) map.current.removeSource('route');
        } catch (err) {
            // Bỏ qua lỗi nếu layer/source không tồn tại
        }
    }, []);

    // ═══ FETCH SÂN CÓ ĐIỀU KIỆN ═══
    const fetchCourts = useCallback(async (opts?: {
        lat?: number; lng?: number; q?: string;
        sportType?: string; sortBy?: string; maxPrice?: number; limit?: number;
    }) => {
        try {
            const params: any = { limit: opts?.limit || 100 };
            if (opts?.lat && opts?.lng) { params.lat = opts.lat; params.lng = opts.lng; }
            if (opts?.q) params.q = opts.q;
            if (opts?.sportType) params.sportType = opts.sportType;
            if (opts?.sortBy) params.sortBy = opts.sortBy;
            if (opts?.maxPrice) params.maxPrice = opts.maxPrice;

            const res = await courtApi.searchCourts(params);
            if (res.data?.data) setCourts(res.data.data as any);
        } catch (error) {
            console.error("Lỗi fetch sân:", error);
        }
    }, []);

    useEffect(() => { fetchCourts({ limit: 100 }); }, [fetchCourts]);

    // TÌM KIẾM DEBOUNCE
    useEffect(() => {
        if (!searchVal.trim()) return;
        const timeout = setTimeout(() => {
            fetchCourts({ q: searchVal, lat: userLoc?.lat, lng: userLoc?.lng });
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchVal, userLoc, fetchCourts]);

    // FILTER
    const handleFilterChip = (chipId: string) => {
        setActiveFilter(chipId);
        setSelected(null);
        setShowRoute(false);
        setRouteInfo(null);
        clearRoute();
        map.current?.flyTo({ pitch: 0, duration: 1000 }); // Đóng popup thì trả về góc nhìn từ trên xuống
        switch (chipId) {
            case 'all': fetchCourts({ limit: 1000 }); break;
            case 'badminton': fetchCourts({ sportType: 'badminton', lat: userLoc?.lat, lng: userLoc?.lng }); break;
            case 'pickleball': fetchCourts({ sportType: 'pickleball', lat: userLoc?.lat, lng: userLoc?.lng }); break;
            case 'nearby': handleLocateMe(); break;
            case 'cheap': fetchCourts({ sortBy: 'price_asc', maxPrice: 80000, lat: userLoc?.lat, lng: userLoc?.lng }); break;
            case 'top_rated': fetchCourts({ sortBy: 'rating', lat: userLoc?.lat, lng: userLoc?.lng }); break;
        }
    };

    // KHỞI TẠO MAP
    useEffect(() => {
        if (!mapContainer.current || !VIETMAP_KEY || !vietmapgl) return;
        if (!map.current) {
            map.current = new vietmapgl.Map({
                container: mapContainer.current,
                style: `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=${VIETMAP_KEY}`,
                center: [106.660172, 10.762622],
                zoom: 12.5,
                pitch: 0, // Mặc định góc nhìn 90 độ từ trên xuống (pitch 0)
            });
            map.current.addControl(new vietmapgl.NavigationControl(), 'top-right');
            map.current.on('click', () => {
                setSelected(null);
                setShowRoute(false);
                setRouteInfo(null);
                clearRoute();
                map.current?.flyTo({ pitch: 0, duration: 1000 });
            });
        }
    }, [VIETMAP_KEY]);

    // ═══ RENDER MARKER ĐẸP MẮT (THEO ĐÁNH GIÁ SAO) ═══
    useEffect(() => {
        if (!map.current || !vietmapgl) return;

        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        const bounds = new vietmapgl.LngLatBounds();
        let hasValidCoords = false;

        courts.forEach(court => {
            const coords = getCourtCoords(court);
            if (!coords) return;
            hasValidCoords = true;
            bounds.extend(coords);

            const isActive = selected?._id === court._id;
            const rating = court.averageRating || 0;

            const emojiStr = renderToString(court.sportTypes?.includes('pickleball') ? <EmojiIcon name="pickleball" /> : <EmojiIcon name="badminton" />);
            const el = document.createElement('div');

            // Màu sắc dựa trên rating
            const ratingColor = rating >= 4.5 ? '#fbbf24' : rating >= 3.8 ? '#34d399' : '#94a3b8';
            const displayRating = rating ? rating.toFixed(1) : 'Mới';

            el.innerHTML = `
                <div style="cursor: pointer; display: flex; flex-direction: column; align-items: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); transform: ${isActive ? 'scale(1.15)' : 'scale(1)'}; z-index: ${isActive ? 10 : 2};">
                    <div style="
                        display: flex; 
                        align-items: center; 
                        gap: 6px;
                        background: ${isActive ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(25, 25, 25, 0.9)'};
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid ${isActive ? '#34d399' : 'rgba(255,255,255,0.1)'};
                        padding: 4px 10px 4px 4px;
                        border-radius: 30px;
                        box-shadow: ${isActive ? '0 8px 25px rgba(16,185,129,0.5)' : '0 4px 15px rgba(0,0,0,0.5)'};
                        color: ${isActive ? '#fff' : '#e2e8f0'};
                        font-family: 'Inter', sans-serif;
                        font-weight: 700;
                        font-size: 13px;
                    ">
                        <div style="
                            display: flex; align-items: center; justify-content: center; 
                            width: 26px; height: 26px; 
                            background: ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}; 
                            border-radius: 50%; 
                            font-size: 14px;
                        ">
                            ${emojiStr}
                        </div>
                        <div style="display: flex; align-items: center; gap: 3px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="${isActive ? '#fff' : ratingColor}" stroke="none">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                            <span style="color: ${isActive ? '#fff' : ratingColor}; margin-top: 1px;">
                                ${displayRating}
                            </span>
                        </div>
                    </div>
                    <div style="
                        width: 0; height: 0; 
                        border-left: 6px solid transparent; 
                        border-right: 6px solid transparent; 
                        border-top: 8px solid ${isActive ? '#059669' : 'rgba(25, 25, 25, 0.9)'}; 
                        margin: 0 auto; 
                    "></div>
                </div>
            `;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelected(court);
                setShowRoute(false);
                setRouteInfo(null);
                clearRoute();
                map.current?.flyTo({ center: coords, zoom: 15.5, pitch: 60, duration: 1500 });
            });

            const marker = new vietmapgl.Marker({ element: el, anchor: 'bottom' }).setLngLat(coords).addTo(map.current!);
            markersRef.current.push(marker);
        });

        if (hasValidCoords && courts.length > 1 && !selected) {
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 14.5, pitch: 0, duration: 1000 });
        }
    }, [courts, selected]);

    // ═══ ĐỊNH VỊ VÀ VÒNG BÁN KÍNH ═══
    const drawRadiusCircle = (lng: number, lat: number, radiusKm: number) => {
        if (!map.current) return;
        const points = 64;
        const coords: [number, number][] = [];
        for (let i = 0; i <= points; i++) {
            const angle = (i / points) * 2 * Math.PI;
            const dx = radiusKm / 111.32 * Math.cos(angle);
            const dy = radiusKm / (111.32 * Math.cos(lat * Math.PI / 180)) * Math.sin(angle);
            coords.push([lng + dy, lat + dx]);
        }
        const geojson = { type: 'Feature' as const, geometry: { type: 'Polygon' as const, coordinates: [coords] }, properties: {} };
        if (radiusLayerRef.current) {
            try { map.current.removeLayer('radius-fill'); map.current.removeLayer('radius-border'); map.current.removeSource('radius-circle'); } catch { }
        }
        map.current.addSource('radius-circle', { type: 'geojson', data: geojson });
        map.current.addLayer({ id: 'radius-fill', type: 'fill', source: 'radius-circle', paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.05 } });
        map.current.addLayer({ id: 'radius-border', type: 'line', source: 'radius-circle', paint: { 'line-color': '#3b82f6', 'line-width': 2, 'line-opacity': 0.4, 'line-dasharray': [4, 4] } });
        radiusLayerRef.current = true;
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) { useAlertStore.getState().showAlert("Trình duyệt không hỗ trợ!", 'Thông báo', 'error'); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude; const lng = pos.coords.longitude;
                setUserLoc({ lat, lng });
                if (map.current) {
                    map.current.flyTo({ center: [lng, lat], zoom: 14.5, pitch: 0, duration: 2000, essential: true });
                    if (userMarkerRef.current) userMarkerRef.current.remove();
                    const userEl = document.createElement('div');
                    userEl.innerHTML = `
                        <div style="position: relative; width: 24px; height: 24px;">
                            <div style="position: absolute; inset: 0; background-color: #3b82f6; border-radius: 50%; opacity: 0.5; animation: pingUser 2s infinite;"></div>
                            <div style="position: relative; width: 24px; height: 24px; background-color: #2563eb; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.8);"></div>
                        </div>
                        <style>@keyframes pingUser { 75%, 100% { transform: scale(2.5); opacity: 0; } }</style>
                    `;
                    userMarkerRef.current = new vietmapgl.Marker({ element: userEl, anchor: 'center' }).setLngLat([lng, lat]).addTo(map.current);
                    drawRadiusCircle(lng, lat, 5);
                    fetchCourts({ lat, lng, sortBy: 'distance' });
                }
            },
            (err) => { console.warn(err); useAlertStore.getState().showAlert("Bật GPS để tìm sân gần bạn!", 'Thông báo', 'info'); },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    // ═══ CHỈ ĐƯỜNG BẰNG ĐƯỜNG THẬT (OSRM API - FREE & UNLIMITED) ═══
    const handleGetDirections = async () => {
        if (!userLoc || !selected || !map.current) {
            if (!userLoc) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => { setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setTimeout(() => handleGetDirections(), 100); },
                    () => useAlertStore.getState().showAlert('Cần bật GPS để tìm đường', 'Thông báo', 'info'), { enableHighAccuracy: true }
                );
            }
            return;
        }

        const courtCoords = getCourtCoords(selected);
        if (!courtCoords) return;

        setShowRoute(true);

        try {
            // Dùng OSRM API công cộng (Miễn phí, vẽ đường bám theo đường thật)
            const url = `https://router.project-osrm.org/route/v1/driving/${userLoc.lng},${userLoc.lat};${courtCoords[0]},${courtCoords[1]}?overview=full&geometries=geojson`;
            const res = await fetch(url);

            if (!res.ok) throw new Error('OSRM API Error');

            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                const route = data.routes[0];
                const distKm = (route.distance / 1000).toFixed(1);
                const durMin = Math.ceil(route.duration / 60);

                setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} phút` });

                const routeCoords = route.geometry.coordinates; // Dữ liệu đường cong
                clearRoute(); // Xóa đường cũ nếu có
                try {
                    map.current.removeLayer('route-line');
                    map.current.removeLayer('route-outline');
                    map.current.removeSource('route');
                } catch { /* ignore */ }

                map.current.addSource('route', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords }, properties: {} },
                });

                // Viền ngoài màu đen
                map.current.addLayer({
                    id: 'route-outline', type: 'line', source: 'route',
                    paint: { 'line-color': '#000', 'line-width': 8, 'line-opacity': 0.4 },
                });

                // Đường chỉ dẫn màu xanh dương
                map.current.addLayer({
                    id: 'route-line', type: 'line', source: 'route',
                    paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 1 },
                });

                // Zoom theo đường đi và nghiêng cam 45 độ
                const routeBounds = new vietmapgl.LngLatBounds();
                routeCoords.forEach((c: [number, number]) => routeBounds.extend(c));
                map.current.fitBounds(routeBounds, { padding: { top: 100, bottom: 300, left: 80, right: 80 }, pitch: 45, duration: 1500 });
            }
        } catch (err) {
            console.error('Lỗi routing OSRM:', err);
            // Fallback lỡ OSRM sập mạng
            const dist = haversineKm(userLoc.lat, userLoc.lng, courtCoords[1], courtCoords[0]);
            setRouteInfo({
                distance: `~${dist.toFixed(1)} km`,
                duration: `~${Math.ceil(dist * 3)} phút`
            });
        }
    };

    const mainPhoto = (c: Court) => c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&fit=crop';

    if (!VIETMAP_KEY) return <div className="h-full flex items-center justify-center text-emerald-500 font-bold bg-card">Thiếu KEY Bản đồ</div>;

    return (
        <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden font-sans">
            <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} className="bg-card" />

            <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-[#121212]/90 via-[#121212]/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-[#121212] via-[#121212]/80 to-transparent z-10 pointer-events-none" />

            {/* TÌM KIẾM & CHIP FILTER */}
            <div className="absolute top-6 left-4 right-4 z-20 pointer-events-none">
                <div className="relative max-w-md mx-auto pointer-events-auto group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
                    <input
                        type="text" placeholder="Tìm sân trên bản đồ..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                        className="w-full h-14 pl-12 pr-14 rounded-2xl bg-card/70 backdrop-blur-2xl border border-border text-foreground placeholder:text-muted-foreground text-[15px] outline-none shadow-[0_8px_30px_rgb(0,0,0,0.5)] focus:border-emerald-500/50 focus:bg-card/90 transition-all"
                    />
                    {searchVal && (
                        <button onClick={() => { setSearchVal(''); fetchCourts({ lat: userLoc?.lat, lng: userLoc?.lng }); }} className="absolute right-14 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/5 hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors border border-border">
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-w-md mx-auto mt-4 flex gap-2.5 overflow-x-auto hide-scrollbar pointer-events-auto snap-x pb-2">
                    {FILTER_CHIPS.map((chip) => (
                        <button key={chip.id} onClick={() => handleFilterChip(chip.id)}
                            className={`snap-start shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border text-[12px] font-medium transition-all duration-300 shadow-lg ${activeFilter === chip.id ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-card/80 backdrop-blur-xl border-border text-muted-foreground hover:border-emerald-500/50'}`}>
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>

            <button onClick={handleLocateMe} className={`absolute right-4 z-20 px-4 py-3 rounded-full bg-emerald-500 text-black text-sm font-bold flex items-center gap-2.5 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:scale-105 transition-all duration-300 active:scale-95 ${selected ? 'bottom-56' : 'bottom-48'}`}>
                <Navigation className="w-4 h-4" /> Sân gần tôi
            </button>

            {/* DANH SÁCH CAROUSEL CÁC SÂN */}
            {!selected && courts.length > 0 && (
                <div className="absolute bottom-16.5 left-0 right-0 z-20 w-full pointer-events-none">
                    <div className="flex overflow-x-auto px-4 pb-4 gap-3 snap-x snap-mandatory hide-scrollbar pointer-events-auto">
                        {courts.slice(0, 10).map((court) => {
                            const coords = getCourtCoords(court);
                            return (
                                <div key={court._id} onClick={() => { setSelected(court); setShowRoute(false); setRouteInfo(null); if (coords) map.current?.flyTo({ center: coords, zoom: 15.5, pitch: 60, duration: 1500 }); }}
                                    className="min-w-65 md:min-w-70 snap-center shrink-0 bg-card/80 backdrop-blur-2xl rounded-2xl border border-border p-2.5 shadow-2xl cursor-pointer hover:border-emerald-500/40 hover:bg-surface/90 transition-all duration-300 group">
                                    <div className="flex gap-3 items-center">
                                        <img src={mainPhoto(court)} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-border group-hover:scale-105 transition-transform duration-500" />
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <h3 className="font-bold text-[14px] text-foreground truncate group-hover:text-emerald-400 transition-colors">{court.name}</h3>
                                            <p className="text-[12px] text-muted-foreground truncate mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {court.address?.district}</p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-emerald-400 font-bold text-[13px] bg-emerald-500/10 px-1.5 py-0.5 rounded-lg">{formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h</span>
                                                <span className="text-[11px] font-bold bg-surface text-amber-400 px-1.5 py-0.5 rounded-lg flex items-center gap-1 border border-border">⭐ {court.averageRating?.toFixed(1) || '5.0'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* POPUP CHI TIẾT SÂN */}
            {selected && (
                <div className="absolute bottom-28 left-4 right-4 md:left-auto md:right-8 md:w-88 z-30 bg-card/95 backdrop-blur-2xl rounded-3xl border border-border p-4 shadow-[0_10px_40px_rgba(0,0,0,0.7)] transition-all animate-in fade-in slide-in-from-bottom-8">
                    <button onClick={() => {
                        setSelected(null);
                        setShowRoute(false);
                        setRouteInfo(null);
                        clearRoute();
                        map.current?.flyTo({ pitch: 0, duration: 1000 }); // Đóng popup thì trả góc cam
                    }} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-border flex items-center justify-center text-foreground/80 hover:text-foreground hover:bg-red-500 hover:border-red-500 hover:scale-110 transition-all z-10">
                        <X className="w-4 h-4 stroke-[2.5px]" />
                    </button>
                    <div className="flex flex-col gap-3">
                        <img src={mainPhoto(selected)} alt="" className="w-full h-32 rounded-2xl object-cover shrink-0 border border-border" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-[16px] text-foreground leading-tight">{selected.name}</h3>
                            <p className="text-[12px] text-muted-foreground flex items-start gap-1.5 mt-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" /><span className="line-clamp-2">{selected.address?.fullAddress || selected.address.district}</span></p>
                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                                <span className="flex items-center gap-1.5 text-[13px] bg-surface px-2.5 py-1 rounded-xl border border-border"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><span className="text-foreground font-bold">{selected.averageRating?.toFixed(1) || '5.0'}</span></span>
                                <span className="text-emerald-400 text-[14px] font-black bg-emerald-500/10 px-2.5 py-1 rounded-xl flex-1 text-center border border-emerald-500/20">{formatPrice(selected.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)} / Giờ</span>
                            </div>
                        </div>
                    </div>
                    {routeInfo && (
                        <div className="flex items-center justify-between gap-2 mt-3 px-3 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                            <span className="flex items-center gap-1.5 text-[12px] font-bold text-blue-400"><Ruler className="w-4 h-4" /> {routeInfo.distance}</span>
                            <span className="flex items-center gap-1.5 text-[12px] font-bold text-blue-400"><Clock className="w-4 h-4" /> {routeInfo.duration}</span>
                        </div>
                    )}
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleGetDirections} className={`flex-1 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${showRoute ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'bg-surface text-muted-foreground border border-border hover:bg-surface'}`}><Route className="w-4 h-4" /> Tìm đường</button>
                        <button onClick={() => setBookingCourt(selected)} className="flex-1 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-400 text-black text-[14px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-[0_5px_20px_rgba(16,185,129,0.4)] active:scale-[0.98]"><Calendar className="w-4 h-4" /> Đặt lịch</button>
                    </div>
                </div>
            )}
        </div>
    );
}