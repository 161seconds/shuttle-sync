import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, SlidersHorizontal, Navigation, MapPin, Star, Calendar, X, Route, Clock, Ruler } from 'lucide-react';
import { formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import type { Court } from '../types';

const vietmapgl = (window as any).vietmapgl;

// ═══ HELPERS (Từ Claude) ═══
function getCourtCoords(court: Court): [number, number] | null {
    const loc = court.location as any;
    if (!loc) return null;

    let lng, lat;

    // Trường hợp 1: Lưu theo chuẩn GeoJSON { coordinates: [lng, lat] }
    if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
        lng = parseFloat(loc.coordinates[0]);
        lat = parseFloat(loc.coordinates[1]);
    }
    // Trường hợp 2: Lưu theo dạng { lng, lat }
    else {
        lng = parseFloat(loc.lng);
        lat = parseFloat(loc.lat);
    }

    // Nếu tọa độ hợp lệ (không bị NaN) thì trả về
    if (!isNaN(lng) && !isNaN(lat)) {
        return [lng, lat];
    }

    return null;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══ FILTER CHIPS CONFIG ═══
const FILTER_CHIPS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'badminton', label: 'Cầu lông' },
    { id: 'pickleball', label: 'Pickleball' },
    { id: 'nearby', label: 'Gần tôi' },
    { id: 'cheap', label: 'Giá rẻ' },
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

    // ═══ 1. FETCH SÂN CÓ ĐIỀU KIỆN (Từ Claude) ═══
    const fetchCourts = useCallback(async (opts?: {
        lat?: number; lng?: number; q?: string;
        sportType?: string; sortBy?: string; maxPrice?: number;
        limit?: number;
    }) => {
        try {
            const params: any = { limit: opts?.limit || 100 };
            if (opts?.lat && opts?.lng) { params.lat = opts.lat; params.lng = opts.lng; }
            if (opts?.q) params.q = opts.q;
            if (opts?.sportType) params.sportType = opts.sportType;
            if (opts?.sortBy) params.sortBy = opts.sortBy;
            if (opts?.maxPrice) params.maxPrice = opts.maxPrice;

            const res = await courtApi.searchCourts(params);
            if (res.data?.data) setCourts(res.data.data);
        } catch (error) {
            console.error("Lỗi fetch sân:", error);
        }
    }, []);

    useEffect(() => {
        fetchCourts({ limit: 100 });
    }, [fetchCourts]);

    // ═══ 2. TÌM KIẾM DEBOUNCE (Tránh gọi API liên tục) ═══
    useEffect(() => {
        if (!searchVal.trim()) return;
        const timeout = setTimeout(() => {
            fetchCourts({ q: searchVal, lat: userLoc?.lat, lng: userLoc?.lng });
        }, 500);
        return () => clearTimeout(timeout);
    }, [searchVal, userLoc, fetchCourts]);

    // ═══ 3. XỬ LÝ CLICK FILTER CHIPS ═══
    const handleFilterChip = (chipId: string) => {
        setActiveFilter(chipId);
        setSelected(null);
        setShowRoute(false);
        setRouteInfo(null);

        switch (chipId) {
            case 'all':
                fetchCourts({ limit: 1000 });
                break;
            case 'badminton':
                fetchCourts({ sportType: 'badminton', lat: userLoc?.lat, lng: userLoc?.lng }); break;
            case 'pickleball':
                fetchCourts({ sportType: 'pickleball', lat: userLoc?.lat, lng: userLoc?.lng }); break;
            case 'nearby':
                handleLocateMe(); break;
            case 'cheap':
                fetchCourts({ sortBy: 'price_asc', maxPrice: 80000, lat: userLoc?.lat, lng: userLoc?.lng }); break;
            case 'top_rated':
                fetchCourts({ sortBy: 'rating', lat: userLoc?.lat, lng: userLoc?.lng }); break;
        }
    };

    // ═══ 4. KHỞI TẠO BẢN ĐỒ ═══
    useEffect(() => {
        if (!mapContainer.current || !VIETMAP_KEY || !vietmapgl) return;

        if (!map.current) {
            map.current = new vietmapgl.Map({
                container: mapContainer.current,
                style: `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=${VIETMAP_KEY}`,
                center: [106.660172, 10.762622],
                zoom: 12.5,
                pitch: 45,
            });

            map.current.addControl(new vietmapgl.NavigationControl(), 'top-right');
            map.current.on('click', () => {
                setSelected(null);
                setShowRoute(false);
            });
        }
    }, [VIETMAP_KEY]);

    // ═══ 5. RENDER MARKERS & TỰ ĐỘNG ZOOM (FIT BOUNDS) ═══
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

            const price = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0;
            const priceText = price > 0 ? `${Math.round(price / 1000)}K` : '??K';
            const isActive = selected?._id === court._id;

            const el = document.createElement('div');
            el.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: all 0.2s; transform: ${isActive ? 'scale(1.15)' : 'scale(1)'}; z-index: ${isActive ? 10 : 1};">
                    <div style="background: ${isActive ? '#10b981' : '#1e1e1e'}; color: ${isActive ? '#000' : '#fff'}; border: 1px solid ${isActive ? '#10b981' : '#333'}; border-radius: 8px; padding: 4px 8px; font-size: 11px; font-weight: bold; margin-bottom: 4px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); white-space: nowrap;">
                        ${priceText}
                    </div>
                    <div style="width: 10px; height: 10px; background: ${isActive ? '#10b981' : '#10b98180'}; border-radius: 50%; border: 2px solid ${isActive ? '#fff' : 'transparent'}; margin: 0 auto; box-shadow: ${isActive ? '0 0 10px #10b981' : 'none'};"></div>
                </div>
            `;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelected(court);
                setShowRoute(false);
                setRouteInfo(null);
                map.current?.flyTo({ center: coords, zoom: 14.5, duration: 1200 });
            });

            const marker = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat(coords)
                .addTo(map.current!);

            markersRef.current.push(marker);
        });

        // Tự động zoom để thấy hết các sân đang hiện
        if (hasValidCoords && courts.length > 1 && !selected) {
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 15, duration: 1000 });
        }
    }, [courts, selected]);

    // ═══ 6. ĐỊNH VỊ + VẼ VÒNG BÁN KÍNH 5KM ═══
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

        const geojson = {
            type: 'Feature' as const,
            geometry: { type: 'Polygon' as const, coordinates: [coords] },
            properties: {},
        };

        if (radiusLayerRef.current) {
            try {
                map.current.removeLayer('radius-fill');
                map.current.removeLayer('radius-border');
                map.current.removeSource('radius-circle');
            } catch { /* ignore */ }
        }

        map.current.addSource('radius-circle', { type: 'geojson', data: geojson });
        map.current.addLayer({
            id: 'radius-fill', type: 'fill', source: 'radius-circle',
            paint: { 'fill-color': '#10b981', 'fill-opacity': 0.06 },
        });
        map.current.addLayer({
            id: 'radius-border', type: 'line', source: 'radius-circle',
            paint: { 'line-color': '#10b981', 'line-width': 1.5, 'line-opacity': 0.3, 'line-dasharray': [4, 4] },
        });
        radiusLayerRef.current = true;
    };

    const handleLocateMe = () => {
        if (!navigator.geolocation) { alert("Trình duyệt không hỗ trợ định vị"); return; }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLoc({ lat, lng });

                if (map.current) {
                    map.current.flyTo({ center: [lng, lat], zoom: 14.5, pitch: 60, duration: 2500, essential: true });

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
                        .setLngLat([lng, lat]).addTo(map.current);

                    drawRadiusCircle(lng, lat, 5);
                    fetchCourts({ lat, lng, sortBy: 'distance' });
                }
            },
            (err) => { console.warn(err); alert("Vui lòng cho phép quyền truy cập vị trí!"); },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    // ═══ 7. TÍNH NĂNG CHỈ ĐƯỜNG (ROUTING) ═══
    function decodePolyline(encoded: string): [number, number][] {
        const coords: [number, number][] = [];
        let index = 0, lat = 0, lng = 0;
        while (index < encoded.length) {
            let b, shift = 0, result = 0;
            do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lat += (result & 1) ? ~(result >> 1) : (result >> 1);
            shift = 0; result = 0;
            do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
            lng += (result & 1) ? ~(result >> 1) : (result >> 1);
            coords.push([lng / 1e5, lat / 1e5]);
        }
        return coords;
    }

    const handleGetDirections = async () => {
        if (!userLoc || !selected || !map.current) {
            if (!userLoc) {
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                        setTimeout(() => handleGetDirections(), 100);
                    },
                    () => alert('Cần bật GPS để chỉ đường'),
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            }
            return;
        }

        const courtCoords = getCourtCoords(selected);
        if (!courtCoords) return;

        setShowRoute(true);

        try {
            const url = `https://maps.vietmap.vn/api/route?api-version=1.1&apikey=${VIETMAP_KEY}&point=${userLoc.lat},${userLoc.lng}&point=${courtCoords[1]},${courtCoords[0]}&vehicle=car&optimize=true`;
            const res = await fetch(url);

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Vietmap API Error (${res.status}): ${errorText}`);
            }

            const data = await res.json();

            if (data.paths && data.paths.length > 0) {
                const path = data.paths[0];
                const distKm = (path.distance / 1000).toFixed(1);
                const durMin = Math.ceil(path.time / 60000);
                setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} phút` });

                const routeCoords = decodePolyline(path.points);

                try {
                    map.current.removeLayer('route-line');
                    map.current.removeLayer('route-outline');
                    map.current.removeSource('route');
                } catch { /* ignore */ }

                map.current.addSource('route', {
                    type: 'geojson',
                    data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords }, properties: {} },
                });

                map.current.addLayer({
                    id: 'route-outline', type: 'line', source: 'route',
                    paint: { 'line-color': '#000', 'line-width': 7, 'line-opacity': 0.3 },
                });

                map.current.addLayer({
                    id: 'route-line', type: 'line', source: 'route',
                    paint: { 'line-color': '#10b981', 'line-width': 4, 'line-opacity': 0.9 },
                });

                const routeBounds = new vietmapgl.LngLatBounds();
                routeCoords.forEach((c: [number, number]) => routeBounds.extend(c));
                map.current.fitBounds(routeBounds, { padding: 80, duration: 1500 });
            }
        } catch (err) {
            console.error('Lỗi routing:', err);
            const dist = haversineKm(userLoc.lat, userLoc.lng, courtCoords[1], courtCoords[0]);
            setRouteInfo({
                distance: `~${dist.toFixed(1)} km (đường chim bay)`,
                duration: `~${Math.ceil(dist * 3)} phút (ước tính)`
            });
        }
    };

    const mainPhoto = (c: Court) =>
        c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop';

    if (!VIETMAP_KEY) {
        return <div className="h-full flex items-center justify-center text-emerald-500 font-bold bg-[#121212]">Thiếu VITE_VIETMAP_KEY trong file .env của client!</div>;
    }

    return (
        <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden font-sans">
            {/* CONTAINER BẢN ĐỒ */}
            <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} className="bg-[#121212]" />

            {/* HIỆU ỨNG VIGNETTE */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-[#121212]/90 via-[#121212]/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-[#121212] via-[#121212]/80 to-transparent z-10 pointer-events-none" />

            {/* KHU VỰC TÌM KIẾM & FILTER */}
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
                    {/* Nút Xóa Search */}
                    {searchVal && (
                        <button onClick={() => { setSearchVal(''); fetchCourts({ lat: userLoc?.lat, lng: userLoc?.lng }); }}
                            className="absolute right-14 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 transition-colors border border-white/5">
                        <SlidersHorizontal className="w-5 h-5" />
                    </button>
                </div>

                <div className="max-w-md mx-auto mt-4 flex gap-2.5 overflow-x-auto hide-scrollbar pointer-events-auto snap-x pb-2">
                    {FILTER_CHIPS.map((chip) => (
                        <button
                            key={chip.id}
                            onClick={() => handleFilterChip(chip.id)}
                            className={`snap-start shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border text-[12px] font-medium transition-all duration-300 shadow-lg ${activeFilter === chip.id
                                ? 'bg-emerald-500 text-black border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                : 'bg-[#1e1e1e]/80 backdrop-blur-xl border-white/10 text-gray-300 hover:border-emerald-500/50'
                                }`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>

                {/* Đếm số lượng sân */}
                {courts.length > 0 && (
                    <div className="max-w-md mx-auto mt-1 pointer-events-auto">
                        <span className="px-2 py-1 rounded bg-[#1e1e1e]/80 backdrop-blur-sm border border-white/10 text-[10px] text-gray-400 font-medium">
                            Tìm thấy {courts.length} sân
                        </span>
                    </div>
                )}
            </div>

            {/* NÚT "SÂN GẦN TÔI" (Giữ nguyên tọa độ chuẩn cũ) */}
            <button
                onClick={handleLocateMe}
                className={`absolute right-4 z-20 px-4 py-3 rounded-full bg-emerald-500 text-black text-sm font-bold flex items-center gap-2.5 shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:scale-105 transition-all duration-300 active:scale-95 ${selected ? 'bottom-56' : 'bottom-48'
                    }`}
            >
                <Navigation className="w-4 h-4" /> Sân gần tôi
            </button>

            {/* DANH SÁCH CAROUSEL CÁC SÂN (Giữ nguyên tọa độ chuẩn cũ) */}
            {!selected && courts.length > 0 && (
                <div className="absolute bottom-16.5 left-0 right-0 z-20 w-full pointer-events-none">
                    <div className="flex overflow-x-auto px-4 pb-4 gap-3 snap-x snap-mandatory hide-scrollbar pointer-events-auto">
                        {courts.slice(0, 10).map((court) => {
                            const coords = getCourtCoords(court);
                            return (
                                <div
                                    key={court._id}
                                    onClick={() => {
                                        setSelected(court);
                                        setShowRoute(false);
                                        setRouteInfo(null);
                                        if (coords) map.current?.flyTo({ center: coords, zoom: 14.5, duration: 1200 });
                                    }}
                                    className="min-w-65 md:min-w-70 snap-center shrink-0 bg-[#1a1a1a]/80 backdrop-blur-2xl rounded-2xl border border-white/10 p-2.5 shadow-2xl cursor-pointer hover:border-emerald-500/40 hover:bg-[#222]/90 transition-all duration-300 group"
                                >
                                    <div className="flex gap-3 items-center">
                                        <img src={mainPhoto(court)} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/5 group-hover:scale-105 transition-transform duration-500" />
                                        <div className="flex-1 min-w-0 py-0.5">
                                            <h3 className="font-bold text-[14px] text-white truncate group-hover:text-emerald-400 transition-colors">{court.name}</h3>
                                            <p className="text-[12px] text-gray-400 truncate mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {court.address?.district}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-emerald-400 font-bold text-[13px] bg-emerald-500/10 px-1.5 py-0.5 rounded-lg">
                                                    {formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}/h
                                                </span>
                                                <span className="text-[11px] font-bold bg-[#2a2a2a] text-amber-400 px-1.5 py-0.5 rounded-lg flex items-center gap-1 border border-white/5">
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

            {/* POPUP CHI TIẾT SÂN KHI ĐƯỢC CHỌN */}
            {selected && (
                <div className="absolute bottom-28 left-4 right-4 md:left-auto md:right-8 md:w-88 z-30 bg-[#1a1a1a]/95 backdrop-blur-2xl rounded-3xl border border-white/10 p-4 shadow-[0_10px_40px_rgba(0,0,0,0.7)] transition-all animate-in fade-in slide-in-from-bottom-8">
                    <button
                        onClick={() => { setSelected(null); setShowRoute(false); setRouteInfo(null); }}
                        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:bg-red-500 hover:border-red-500 hover:scale-110 hover:shadow-[0_0_15px_rgba(239,68,68,0.6)] transition-all duration-300 z-10"
                    >
                        <X className="w-4 h-4 stroke-[2.5px]" />
                    </button>

                    <div className="flex flex-col gap-3">
                        <img src={mainPhoto(selected)} alt="" className="w-full h-32 rounded-2xl object-cover shrink-0 border border-white/5" />
                        <div className="flex-1 min-w-0">
                            <h3 className="font-extrabold text-[16px] text-white leading-tight">{selected.name}</h3>
                            <p className="text-[12px] text-gray-400 flex items-start gap-1.5 mt-1.5">
                                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
                                <span className="line-clamp-2">{selected.address?.fullAddress || selected.address.district}</span>
                            </p>

                            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                                <span className="flex items-center gap-1.5 text-[13px] bg-[#2a2a2a] px-2.5 py-1 rounded-xl border border-white/5">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className="text-white font-bold">{selected.averageRating?.toFixed(1) || '5.0'}</span>
                                </span>
                                <span className="text-emerald-400 text-[14px] font-black bg-emerald-500/10 px-2.5 py-1 rounded-xl flex-1 text-center border border-emerald-500/20">
                                    {formatPrice(selected.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)} / Giờ
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Hiển thị thông tin Khoảng cách & Thời gian (Nếu đã bấm chỉ đường) */}
                    {routeInfo && (
                        <div className="flex items-center gap-4 mt-3 px-3 py-2.5 rounded-xl bg-black/40 border border-white/10">
                            <span className="flex items-center gap-1.5 text-[13px] font-medium text-emerald-400">
                                <Ruler className="w-4 h-4" /> {routeInfo.distance}
                            </span>
                            <span className="flex items-center gap-1.5 text-[13px] font-medium text-blue-400">
                                <Clock className="w-4 h-4" /> {routeInfo.duration}
                            </span>
                        </div>
                    )}

                    {/* Nút chức năng */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleGetDirections}
                            className={`flex-1 py-3 rounded-xl text-[14px] font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${showRoute
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                                : 'bg-[#2a2a2a] text-gray-300 border border-white/10 hover:bg-[#333]'
                                }`}
                        >
                            <Route className="w-4 h-4" /> Chỉ đường
                        </button>
                        <button
                            onClick={() => setBookingCourt(selected)}
                            className="flex-1 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-emerald-400 text-black text-[14px] font-bold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity shadow-[0_5px_20px_rgba(16,185,129,0.4)] active:scale-[0.98]"
                        >
                            <Calendar className="w-4 h-4" /> Đặt lịch
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}