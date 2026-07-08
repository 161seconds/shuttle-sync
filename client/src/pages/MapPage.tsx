import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, SlidersHorizontal, Navigation, MapPin, Star, Calendar, X, Route, Clock, LocateFixed } from 'lucide-react';
import { formatPrice } from '../utils/theme';
import { useAppStore } from '../store';
import { courtApi } from '../api/court.api';
import type { Court } from '../types';
import { EmojiIcon } from '../components/EmojiIcon';
import { renderToString } from 'react-dom/server';
import { useAlertStore } from '../stores/useAlertStore';
import { useTheme } from '../components/theme-provider';

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

function distanceToRoute(loc: {lat: number, lng: number}, routeCoords: [number, number][]): number {
    if (!routeCoords || routeCoords.length === 0) return Infinity;
    let minDist = Infinity;
    for (const coord of routeCoords) {
        const dist = haversineKm(loc.lat, loc.lng, coord[1], coord[0]);
        if (dist < minDist) minDist = dist;
    }
    return minDist;
}

function calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => deg * Math.PI / 180;
    const toDeg = (rad: number) => rad * 180 / Math.PI;
    const dLng = toRad(lng2 - lng1);
    const radLat1 = toRad(lat1);
    const radLat2 = toRad(lat2);
    const y = Math.sin(dLng) * Math.cos(radLat2);
    const x = Math.cos(radLat1) * Math.sin(radLat2) - Math.sin(radLat1) * Math.cos(radLat2) * Math.cos(dLng);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function getRouteBearing(loc: {lat: number, lng: number}, routeCoords: [number, number][]): number {
    if (!routeCoords || routeCoords.length < 2) return 0;
    let minDist = Infinity;
    let minIdx = 0;
    for (let i=0; i<routeCoords.length; i++) {
        const dist = haversineKm(loc.lat, loc.lng, routeCoords[i][1], routeCoords[i][0]);
        if (dist < minDist) {
            minDist = dist;
            minIdx = i;
        }
    }
    let p1, p2;
    if (minIdx < routeCoords.length - 1) {
        p1 = routeCoords[minIdx];
        p2 = routeCoords[minIdx + 1];
    } else {
        p1 = routeCoords[minIdx - 1];
        p2 = routeCoords[minIdx];
    }
    return calculateBearing(p1[1], p1[0], p2[1], p2[0]);
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
    const showRouteRef = useRef(false);
    useEffect(() => {
        showRouteRef.current = showRoute;
    }, [showRoute]);

    const [isLoadingRoute, setIsLoadingRoute] = useState(false);
    const [allRoutes, setAllRoutes] = useState<any[]>([]);
    const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
    const [is3D, setIs3D] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);

    const isNavigatingRef = useRef(false);
    const isFollowingRef = useRef(false);
    const allRoutesRef = useRef<any[]>([]);
    const selectedRouteIdxRef = useRef(0);

    useEffect(() => {
        isNavigatingRef.current = isNavigating;
        isFollowingRef.current = isFollowing;
        allRoutesRef.current = allRoutes;
        selectedRouteIdxRef.current = selectedRouteIdx;
    }, [isNavigating, isFollowing, allRoutes, selectedRouteIdx]);

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any | null>(null);
    const markersRef = useRef<any[]>([]);
    const userMarkerRef = useRef<any | null>(null);
    const radiusLayerRef = useRef<boolean>(false);
    const watchIdRef = useRef<number | null>(null);
    const lastRouteUpdateLoc = useRef<{lat: number, lng: number} | null>(null);

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const VIETMAP_KEY = import.meta.env.VITE_VIETMAP_KEY;

    // ═══ HÀM DỌN DẸP ĐƯỜNG ĐI ═══
    const clearRoute = useCallback(() => {
        if (!map.current) return;
        try {
            for (let i = 0; i < 3; i++) {
                if (map.current.getLayer(`route-line-${i}`)) map.current.removeLayer(`route-line-${i}`);
                if (map.current.getLayer(`route-outline-${i}`)) map.current.removeLayer(`route-outline-${i}`);
                if (map.current.getSource(`route-${i}`)) map.current.removeSource(`route-${i}`);
            }
        } catch (err) {
            // Bỏ qua lỗi nếu layer/source không tồn tại
        }
    }, []);

    // ═══ HÀM VẼ NHIỀU ĐƯỜNG ĐI ═══
    const drawRoutes = useCallback((routes: any[], selectedIdx: number) => {
        if (!map.current) return;
        clearRoute();
        
        // Vẽ các đường phụ trước (nằm dưới)
        routes.forEach((route, i) => {
            if (i === selectedIdx) return;
            const routeCoords = route.geometry.coordinates;
            map.current.addSource(`route-${i}`, {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords }, properties: {} },
            });
            map.current.addLayer({
                id: `route-outline-${i}`, type: 'line', source: `route-${i}`,
                paint: { 'line-color': '#000', 'line-width': 6, 'line-opacity': 0.3 },
            });
            map.current.addLayer({
                id: `route-line-${i}`, type: 'line', source: `route-${i}`,
                paint: { 'line-color': '#64748b', 'line-width': 3, 'line-opacity': 0.8 },
            });
        });

        // Vẽ đường chính sau (nằm trên)
        const selectedRoute = routes[selectedIdx];
        if (selectedRoute) {
            const routeCoords = selectedRoute.geometry.coordinates;
            map.current.addSource(`route-${selectedIdx}`, {
                type: 'geojson',
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoords }, properties: {} },
            });
            map.current.addLayer({
                id: `route-outline-${selectedIdx}`, type: 'line', source: `route-${selectedIdx}`,
                paint: { 'line-color': '#000', 'line-width': 8, 'line-opacity': 0.4 },
            });
            map.current.addLayer({
                id: `route-line-${selectedIdx}`, type: 'line', source: `route-${selectedIdx}`,
                paint: { 'line-color': '#3b82f6', 'line-width': 4, 'line-opacity': 1 },
            });
        }
    }, [clearRoute]);

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
            const styleUrl = isDark 
                ? `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=${VIETMAP_KEY}`
                : `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${VIETMAP_KEY}`;

            map.current = new vietmapgl.Map({
                container: mapContainer.current,
                style: styleUrl,
                center: [106.660172, 10.762622],
                zoom: 12.5,
                pitch: 0, // Mặc định góc nhìn 90 độ từ trên xuống (pitch 0)
            });
            map.current.addControl(new vietmapgl.NavigationControl(), 'top-right');
            map.current.on('click', () => {
                if (showRouteRef.current) return;
                
                setSelected(null);
                setShowRoute(false);
                setIsNavigating(false);
                setIsFollowing(false);
                setAllRoutes([]);
                setRouteInfo(null);
                clearRoute();
                map.current?.flyTo({ pitch: 0, bearing: 0, duration: 1000 });
            });

            // Lắng nghe sự kiện kéo bản đồ để tắt isFollowing
            const disableFollowing = () => setIsFollowing(false);
            map.current.on('dragstart', disableFollowing);
            map.current.on('touchstart', disableFollowing);
            map.current.on('mousedown', disableFollowing);
            map.current.on('wheel', disableFollowing);
            map.current.on('pitchend', () => {
                setIs3D(map.current.getPitch() > 40);
            });
            
            // Tự động thêm layer toà nhà 3D mỗi khi style tải xong
            map.current.on('style.load', () => {
                if (!map.current) return;
                try {
                    const sources = map.current.getStyle().sources;
                    // Tìm source vector (thường là openmaptiles)
                    const sourceName = Object.keys(sources).find(k => sources[k].type === 'vector') || 'openmaptiles';

                    if (!map.current.getLayer('3d-buildings')) {
                        map.current.addLayer({
                            'id': '3d-buildings',
                            'source': sourceName,
                            'source-layer': 'building',
                            'filter': ['==', 'extrude', 'true'],
                            'type': 'fill-extrusion',
                            'minzoom': 14,
                            'paint': {
                                'fill-extrusion-color': ['case',
                                    ['boolean', ['feature-state', 'hover'], false],
                                    '#10b981', // Màu xanh khi hover (nếu có)
                                    isDark ? '#374151' : '#e5e7eb' // Màu toà nhà tối/sáng
                                ],
                                'fill-extrusion-height': ['get', 'height'],
                                'fill-extrusion-base': ['get', 'min_height'],
                                'fill-extrusion-opacity': isDark ? 0.8 : 0.6
                            }
                        });
                    }
                } catch (e) {
                    console.error("Không thể thêm 3D buildings layer:", e);
                }
            });
        }
    }, [VIETMAP_KEY, isDark]);

    // Lắng nghe thay đổi theme để đổi màu bản đồ
    useEffect(() => {
        if (!map.current || !vietmapgl) return;
        const styleUrl = isDark 
            ? `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=${VIETMAP_KEY}`
            : `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${VIETMAP_KEY}`;
        
        map.current.setStyle(styleUrl);
        
        // Vẽ lại các layer (bán kính, đường đi) sau khi style mới load xong
        map.current.once('style.load', () => {
            if (userLoc && radiusLayerRef.current) {
                drawRadiusCircle(userLoc.lng, userLoc.lat, 5);
            }
            if (showRoute && selected) {
                handleGetDirections(false);
            }
        });
    }, [isDark, VIETMAP_KEY]);

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
                        background: ${isActive ? 'linear-gradient(135deg, #10b981, #059669)' : (isDark ? 'rgba(25, 25, 25, 0.9)' : 'rgba(255, 255, 255, 0.9)')};
                        backdrop-filter: blur(12px);
                        -webkit-backdrop-filter: blur(12px);
                        border: 1px solid ${isActive ? '#34d399' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)')};
                        padding: 4px 10px 4px 4px;
                        border-radius: 30px;
                        box-shadow: ${isActive ? '0 8px 25px rgba(16,185,129,0.5)' : (isDark ? '0 4px 15px rgba(0,0,0,0.5)' : '0 4px 15px rgba(0,0,0,0.1)')};
                        color: ${isActive ? '#fff' : (isDark ? '#fff' : '#000')};
                        font-family: 'Inter', sans-serif;
                        font-weight: 700;
                        font-size: 13px;
                    ">
                        <div style="
                            display: flex; align-items: center; justify-content: center; 
                            width: 26px; height: 26px; 
                            background: ${isActive ? 'rgba(255,255,255,0.2)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')}; 
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
                        border-top: 8px solid ${isActive ? '#059669' : (isDark ? 'rgba(25, 25, 25, 0.9)' : 'rgba(255, 255, 255, 0.9)')}; 
                        margin: 0 auto; 
                    "></div>
                </div>
            `;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                setSelected(court);
                setShowRoute(false);
                setIsNavigating(false);
                setIsFollowing(false);
                setAllRoutes([]);
                setRouteInfo(null);
                clearRoute();
                map.current?.flyTo({ center: coords, zoom: 15.5, pitch: 60, bearing: 0, duration: 1500 });
            });

            const marker = new vietmapgl.Marker({ element: el, anchor: 'bottom' }).setLngLat(coords).addTo(map.current!);
            markersRef.current.push(marker);
        });

        if (hasValidCoords && courts.length > 1 && !selected) {
            map.current.fitBounds(bounds, { padding: 80, maxZoom: 14.5, pitch: 0, duration: 1000 });
        }
    }, [courts, selected, isDark]);

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

    // ═══ THEO DÕI VỊ TRÍ THỜI GIAN THỰC KHI ĐI ĐƯỜNG ═══
    useEffect(() => {
        if (showRoute && selected && navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setUserLoc(prev => {
                        if (!prev || haversineKm(prev.lat, prev.lng, lat, lng) > 0.005) {
                            return { lat, lng };
                        }
                        return prev;
                    });
                    
                    if (userMarkerRef.current) {
                        userMarkerRef.current.setLngLat([lng, lat]);
                    }

                    // Nếu đang trong chế độ dẫn đường và following, tự động focus camera và bearing
                    if (isNavigatingRef.current && isFollowingRef.current && map.current && allRoutesRef.current.length > 0) {
                        const currentRouteCoords = allRoutesRef.current[selectedRouteIdxRef.current]?.geometry?.coordinates;
                        const bearing = getRouteBearing({lat, lng}, currentRouteCoords);
                        map.current.easeTo({
                            center: [lng, lat],
                            bearing: bearing,
                            pitch: 60,
                            zoom: 17,
                            duration: 1000
                        });
                    }
                },
                (err) => console.warn('Lỗi watchPosition:', err),
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
            );
        } else {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        }
        
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
        };
    }, [showRoute, selected]);

    // ═══ THEO DÕI ĐI LỆCH HƯỚNG VÀ RE-ROUTING ═══
    useEffect(() => {
        if (showRoute && isNavigating && userLoc && selected && allRoutes.length > 0) {
            const currentRouteCoords = allRoutes[selectedRouteIdx]?.geometry?.coordinates;
            if (currentRouteCoords) {
                const distToRoute = distanceToRoute(userLoc, currentRouteCoords);
                // Nếu đi lệch khỏi đường đã chọn quá 50m (0.05 km), tìm đường mới
                if (distToRoute > 0.05) {
                    const last = lastRouteUpdateLoc.current;
                    // Đảm bảo user đã di chuyển ít nhất 30m kể từ lần update route cuối để tránh re-route liên tục
                    if (!last || haversineKm(last.lat, last.lng, userLoc.lat, userLoc.lng) > 0.03) {
                        lastRouteUpdateLoc.current = userLoc;
                        // eslint-disable-next-line react-hooks/exhaustive-deps
                        handleGetDirections(true);
                    }
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userLoc, showRoute, isNavigating, selected]); // Không thêm allRoutes vào đây để tránh loop

    // ═══ CHỈ ĐƯỜNG BẰNG ĐƯỜNG THẬT (OSRM API - FREE & UNLIMITED) ═══
    const handleGetDirections = async (isUpdate = false) => {
        if (!isUpdate) setIsLoadingRoute(true);

        try {
            let currentLoc = userLoc;
            if (!currentLoc && !isUpdate) {
                try {
                    currentLoc = await new Promise((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(
                            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                            (err) => reject(err),
                            { enableHighAccuracy: true }
                        );
                    });
                    setUserLoc(currentLoc);
                } catch (err) {
                    useAlertStore.getState().showAlert('Cần bật GPS để tìm đường', 'Thông báo', 'info');
                    return;
                }
            }

            if (!currentLoc || !selected || !map.current) {
                return;
            }

            const courtCoords = getCourtCoords(selected);
            if (!courtCoords) return;

            setShowRoute(true);

            // Lấy nhiều đường với alternatives=true
            const url = `https://router.project-osrm.org/route/v1/driving/${currentLoc.lng},${currentLoc.lat};${courtCoords[0]},${courtCoords[1]}?overview=full&geometries=geojson&alternatives=true`;
            const res = await fetch(url);

            if (!res.ok) throw new Error('OSRM API Error');

            const data = await res.json();

            if (data.routes && data.routes.length > 0) {
                setAllRoutes(data.routes);
                setSelectedRouteIdx(0);
                
                const route = data.routes[0];
                const distKm = (route.distance / 1000).toFixed(1);
                const durMin = Math.ceil(route.duration / 60);

                setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} phút` });

                drawRoutes(data.routes, 0);

                if (isUpdate === true) {
                    // Nếu là update thời gian thực, có thể center camera theo người dùng
                    map.current.easeTo({ center: [currentLoc.lng, currentLoc.lat], duration: 1000 });
                } else {
                    // Zoom theo đường đi và nghiêng cam 45 độ
                    const routeCoords = route.geometry.coordinates;
                    const routeBounds = new vietmapgl.LngLatBounds();
                    routeCoords.forEach((c: [number, number]) => routeBounds.extend(c));
                    map.current.fitBounds(routeBounds, { padding: { top: 100, bottom: 300, left: 80, right: 80 }, pitch: 45, duration: 1500 });
                }
            }
        } catch (err) {
            console.error('Lỗi routing OSRM:', err);
            // Fallback lỡ OSRM sập mạng
            const courtCoords = selected ? getCourtCoords(selected) : null;
            if (userLoc && courtCoords) {
                const dist = haversineKm(userLoc.lat, userLoc.lng, courtCoords[1], courtCoords[0]);
                setRouteInfo({
                    distance: `~${dist.toFixed(1)} km`,
                    duration: `~${Math.ceil(dist * 3)} phút`
                });
            }
        } finally {
            if (!isUpdate) setIsLoadingRoute(false);
        }
    };

    const mainPhoto = (c: Court) => c.photos?.find(p => p.isMain)?.url || c.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&fit=crop';

    if (!VIETMAP_KEY) return <div className="h-full flex items-center justify-center text-emerald-500 font-bold bg-card">Thiếu KEY Bản đồ</div>;

    return (
        <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden font-sans">
            <div ref={mapContainer} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} className="bg-card" />

            <div className="absolute top-0 left-0 right-0 h-40 bg-linear-to-b from-background via-background/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-64 bg-linear-to-t from-background via-background/80 to-transparent z-10 pointer-events-none" />

            {/* TÌM KIẾM & CHIP FILTER */}
            {!showRoute && (
                <div className="absolute top-6 left-4 right-4 z-20 pointer-events-none">
                    <div className="relative max-w-md mx-auto pointer-events-auto group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-emerald-400 transition-colors" />
                        <input
                            type="text" placeholder="Tìm sân trên bản đồ..." value={searchVal} onChange={(e) => setSearchVal(e.target.value)}
                            className="w-full h-14 pl-12 pr-14 rounded-2xl bg-card/70 backdrop-blur-2xl border border-border text-foreground placeholder:text-muted-foreground text-[15px] outline-none shadow-xl shadow-black/10 focus:border-emerald-500/50 focus:bg-card/90 transition-all"
                        />
                        {searchVal && (
                            <button onClick={() => { setSearchVal(''); fetchCourts({ lat: userLoc?.lat, lng: userLoc?.lng }); }} className="absolute right-14 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                                <X className="w-3 h-3" />
                            </button>
                        )}
                        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl bg-card hover:bg-muted flex items-center justify-center text-muted-foreground transition-colors border border-border">
                            <SlidersHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="max-w-md mx-auto mt-4 flex gap-2.5 overflow-x-auto hide-scrollbar pointer-events-auto snap-x pb-2">
                        {FILTER_CHIPS.map((chip) => (
                            <button key={chip.id} onClick={() => handleFilterChip(chip.id)}
                                className={`snap-start shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full border text-[12px] font-medium transition-all duration-300 shadow-lg ${activeFilter === chip.id ? 'bg-emerald-500 text-black border-emerald-500 shadow-glow-lg' : 'bg-card/80 backdrop-blur-xl border-border text-muted-foreground hover:border-emerald-500/50'}`}>
                                {chip.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {!showRoute && (
                <>
                    <button onClick={() => {
                        if (map.current) map.current.flyTo({ pitch: is3D ? 0 : 60, duration: 1000 });
                    }} className={`absolute right-4 z-20 w-12 h-12 rounded-full font-black text-[15px] flex items-center justify-center transition-all duration-300 active:scale-95 shadow-lg ${is3D ? 'bg-emerald-500 text-black shadow-glow-lg border-emerald-500' : 'bg-card/90 backdrop-blur-md text-foreground border border-border'} ${selected ? 'bottom-72' : 'bottom-64'}`}>
                        3D
                    </button>

                    <button onClick={handleLocateMe} className={`absolute right-4 z-20 px-4 py-3 rounded-full bg-emerald-500 text-black text-sm font-bold flex items-center gap-2.5 shadow-glow-lg hover:bg-emerald-400 hover:scale-105 transition-all duration-300 active:scale-95 ${selected ? 'bottom-56' : 'bottom-48'}`}>
                        <Navigation className="w-4 h-4" /> Sân gần tôi
                    </button>
                </>
            )}

            {/* DANH SÁCH CAROUSEL CÁC SÂN */}
            {!selected && !showRoute && courts.length > 0 && (
                <div className="absolute bottom-16.5 left-0 right-0 z-20 w-full pointer-events-none">
                    <div className="flex overflow-x-auto px-4 pb-4 gap-4 snap-x snap-mandatory hide-scrollbar pointer-events-auto">
                        {courts.slice(0, 10).map((court) => {
                            const coords = getCourtCoords(court);
                            return (
                                <div key={court._id} onClick={() => { setSelected(court); setShowRoute(false); setRouteInfo(null); if (coords) map.current?.flyTo({ center: coords, zoom: 15.5, pitch: 60, duration: 1500 }); }}
                                    className="min-w-65 md:min-w-80 snap-center shrink-0 bg-card/70 backdrop-blur-3xl rounded-3xl border border-white/5 p-3 shadow-2xl cursor-pointer hover:border-emerald-500/40 hover:bg-surface/90 hover:-translate-y-1 transition-all duration-300 group">
                                    <div className="flex gap-4 items-center h-full">
                                        <div className="w-20 h-20 shrink-0 relative overflow-hidden rounded-2xl shadow-lg">
                                            <img src={mainPhoto(court)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
                                        </div>
                                        <div className="flex-1 min-w-0 py-1 flex flex-col justify-between h-full">
                                            <div>
                                                <h3 className="font-extrabold text-[15px] text-foreground truncate group-hover:text-emerald-400 transition-colors leading-tight">{court.name}</h3>
                                                <p className="text-[12px] font-medium text-muted-foreground truncate mt-1 flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> 
                                                    {court.address?.district}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto">
                                                <span className="text-emerald-400 font-black text-[14px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg shadow-inner">{formatPrice(court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)}<span className="text-[10px] font-semibold text-emerald-500/60 ml-0.5">/h</span></span>
                                                <span className="text-[12px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-amber-500/20 shadow-inner"><Star className="w-3 h-3 fill-amber-400" /> {court.averageRating?.toFixed(1) || '5.0'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* THÔNG TIN KHI TÌM ĐƯỜNG HOẶC NAVIGATION */}
            {selected && showRoute && (
                <>
                    {/* Navigation Bar (Top) */}
                    <div className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
                        {!isNavigating && allRoutes.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                                {allRoutes.map((r, i) => (
                                    <button key={i} onClick={() => {
                                        setSelectedRouteIdx(i);
                                        const distKm = (r.distance / 1000).toFixed(1);
                                        const durMin = Math.ceil(r.duration / 60);
                                        setRouteInfo({ distance: `${distKm} km`, duration: `${durMin} phút` });
                                        drawRoutes(allRoutes, i);
                                    }} className={`shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-bold border transition-all shadow-md ${i === selectedRouteIdx ? 'bg-blue-600 text-white border-blue-700 shadow-blue-500/30' : 'bg-surface text-foreground border-border hover:bg-surface/80'}`}>
                                        Tuyến {i + 1}: {(r.distance / 1000).toFixed(1)}km
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="bg-surface/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-border flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="font-black text-xl text-foreground flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-500"/> {routeInfo?.duration}
                                </span>
                                <span className="text-muted-foreground text-sm font-medium mt-1">
                                    Khoảng cách: {routeInfo?.distance}
                                </span>
                            </div>
                            
                            {!isNavigating ? (
                                <button onClick={() => {
                                    setIsNavigating(true);
                                    setIsFollowing(true);
                                    if (map.current && userLoc && allRoutes.length > 0) {
                                        const routeCoords = allRoutes[selectedRouteIdx]?.geometry?.coordinates;
                                        const bearing = getRouteBearing(userLoc, routeCoords);
                                        map.current.flyTo({ center: [userLoc.lng, userLoc.lat], zoom: 17, pitch: 60, bearing: bearing, duration: 1500 });
                                    }
                                }} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2">
                                    <Navigation className="w-5 h-5" /> BẮT ĐẦU
                                </button>
                            ) : (
                                <button onClick={() => {
                                    setShowRoute(false);
                                    setIsNavigating(false);
                                    setIsFollowing(false);
                                    setAllRoutes([]);
                                    setRouteInfo(null);
                                    clearRoute();
                                    map.current?.flyTo({ pitch: 0, bearing: 0, duration: 1000 });
                                }} className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center gap-2">
                                    <X className="w-5 h-5" /> THOÁT
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Nút Re-center khi Navigation bị kéo lệch */}
                    {isNavigating && !isFollowing && (
                        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-auto animate-in slide-in-from-bottom-4 fade-in">
                            <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => {
                                e.stopPropagation();
                                setIsFollowing(true);
                                if (map.current && userLoc && allRoutes.length > 0) {
                                    const routeCoords = allRoutes[selectedRouteIdx]?.geometry?.coordinates;
                                    const bearing = getRouteBearing(userLoc, routeCoords);
                                    map.current.flyTo({ center: [userLoc.lng, userLoc.lat], zoom: 17, pitch: 60, bearing: bearing, duration: 1000 });
                                }
                            }} className="bg-surface/90 backdrop-blur-md text-blue-500 border border-blue-500/20 font-bold py-3 px-6 rounded-full shadow-xl transition-all active:scale-95 flex items-center gap-2">
                                <LocateFixed className="w-5 h-5" /> Về giữa
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* POPUP CHI TIẾT SÂN */}
            {selected && !showRoute && (
                <div className="absolute bottom-28 left-4 right-4 md:left-auto md:right-8 md:w-96 z-30 bg-card/80 backdrop-blur-3xl rounded-[2rem] border border-white/5 p-5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] transition-all animate-in fade-in slide-in-from-bottom-8 overflow-hidden group/popup">
                    <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    
                    <button onClick={() => {
                        setSelected(null);
                        setShowRoute(false);
                        setRouteInfo(null);
                        clearRoute();
                        map.current?.flyTo({ pitch: 0, duration: 1000 }); // Đóng popup thì trả góc cam
                    }} className="absolute top-7 right-7 w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/60 active:scale-95 transition-all z-20 shadow-lg">
                        <X className="w-4 h-4 stroke-[2.5px]" />
                    </button>
                    
                    <div className="flex flex-col gap-4 relative z-10">
                        <div className="relative w-full h-40 rounded-2xl overflow-hidden shadow-lg border border-white/5">
                            <img src={mainPhoto(selected)} alt="" className="w-full h-full object-cover group-hover/popup:scale-105 transition-transform duration-1000 ease-out" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#08090a] via-transparent to-black/20" />
                            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span className="text-white font-bold text-[13px]">{selected.averageRating?.toFixed(1) || '5.0'}</span>
                                <span className="text-white/60 text-[11px] ml-0.5">({selected.reviewCount || 0})</span>
                            </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-[18px] text-foreground leading-tight tracking-tight">{selected.name}</h3>
                            <p className="text-[13px] font-medium text-muted-foreground flex items-start gap-1.5 mt-2"><MapPin className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" /><span className="line-clamp-2">{selected.address?.fullAddress || selected.address.district}</span></p>
                            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                                <div className="bg-surface/50 border border-border px-3 py-1.5 rounded-xl flex items-center gap-2">
                                    <span className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">{selected.sportTypes?.includes('badminton') ? '🏸 Cầu lông' : '🎾 Pickleball'}</span>
                                </div>
                                <div className="text-emerald-400 text-[16px] font-black bg-emerald-500/10 px-3 py-1.5 rounded-xl flex-1 text-center border border-emerald-500/20 shadow-inner">
                                    {formatPrice(selected.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0)} <span className="text-xs text-emerald-500/50">/ Giờ</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-5 relative z-10">
                        <button disabled={isLoadingRoute} onClick={() => handleGetDirections()} className={`flex-1 py-3.5 rounded-2xl text-[14px] font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg bg-surface border border-border text-foreground hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 ${isLoadingRoute ? 'opacity-70 cursor-not-allowed' : ''}`}>
                            {isLoadingRoute ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ĐANG TÌM...
                                </>
                            ) : (
                                <>
                                    <Route className="w-4 h-4" /> ĐƯỜNG ĐI
                                </>
                            )}
                        </button>
                        <button onClick={() => setBookingCourt(selected)} className="flex-[1.5] py-3.5 rounded-2xl bg-emerald-500 text-black text-[14px] font-black flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/25 active:scale-[0.98]"><Calendar className="w-4 h-4" /> ĐẶT LỊCH</button>
                    </div>
                </div>
            )}
        </div>
    );
}