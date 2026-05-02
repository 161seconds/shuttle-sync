import React, { useEffect, useRef, useMemo, useState } from 'react';
import { formatPrice } from '../utils/theme';

const vietmapgl = (window as any).vietmapgl;

function getCoords(court: any): [number, number] | null {
    const loc = court.location;
    if (!loc) return null;
    if (loc.coordinates && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
        return [loc.coordinates[0], loc.coordinates[1]];
    }
    if (typeof loc.lng === 'number' && typeof loc.lat === 'number') {
        return [loc.lng, loc.lat];
    }
    return null;
}

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

interface MapViewProps {
    courts: any[];
    selectedCourtId?: string | null;
    onCourtSelect?: (court: any) => void;
    hoveredCourtId?: string | null;
    triggerLocateMe?: boolean;
}

const MapView: React.FC<MapViewProps> = ({
    courts,
    selectedCourtId,
    onCourtSelect,
    hoveredCourtId,
    triggerLocateMe
}) => {
    const VIETMAP_KEY = (import.meta as any).env?.VITE_VIETMAP_KEY;

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<any>(null);
    const markersRef = useRef<Map<string, any>>(new Map());
    const markerElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());

    const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
    const userMarkerRef = useRef<any | null>(null);
    const radiusLayerRef = useRef<boolean>(false);

    const validCourts = useMemo(() => courts.filter(c => getCoords(c) !== null), [courts]);
    console.log("📍 Tọa độ 10 sân đầu tiên:", validCourts.slice(0, 10).map(c => getCoords(c)));
    const defaultCenter: [number, number] = useMemo(() => {
        if (validCourts.length > 0) {
            const c = getCoords(validCourts[0]);
            return c || [106.660172, 10.762622];
        }
        return [106.660172, 10.762622];
    }, [validCourts]);

    // 1. Init map
    useEffect(() => {
        if (!mapContainer.current || !VIETMAP_KEY || !vietmapgl) return;

        if (!map.current) {
            map.current = new vietmapgl.Map({
                container: mapContainer.current,
                style: `https://maps.vietmap.vn/maps/styles/dm/style.json?apikey=${VIETMAP_KEY}`,
                center: defaultCenter,
                zoom: 12.5,
                pitch: 40,
            });
            map.current.addControl(new vietmapgl.NavigationControl(), 'bottom-right');

            map.current.on('click', () => {
                onCourtSelect?.(null);
                clearRoute();
            });
        }
    }, [VIETMAP_KEY]);

    // 2. Sync markers & Popups
    useEffect(() => {
        if (!map.current || !vietmapgl) return;

        // Remove old markers
        markersRef.current.forEach(m => m.remove());
        markersRef.current.clear();
        markerElementsRef.current.clear();

        const bounds = new vietmapgl.LngLatBounds();
        let hasCoords = false;

        validCourts.forEach((court) => {
            const coords = getCoords(court)!;
            hasCoords = true;
            bounds.extend(coords);

            const isSelected = court._id === selectedCourtId;
            const isHovered = court._id === hoveredCourtId;
            const highlight = isSelected || isHovered;

            const price = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0;
            const rating = court.averageRating?.toFixed(1) || '5.0';

            const el = document.createElement('div');
            el.className = 'mapview-marker';
            el.style.cursor = 'pointer';
            el.style.transition = 'transform 0.2s';
            el.style.transform = highlight ? 'scale(1.2) translateY(-5px)' : 'scale(1) translateY(0)';
            el.style.zIndex = highlight ? '10' : '1';
            el.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;">
                    <div style="background:${highlight ? '#10b981' : '#151515'};color:${highlight ? '#000' : '#eaeaea'};border:1.5px solid ${highlight ? '#10b981' : '#2a2a2a'};border-radius:8px;padding:3px 7px;font-size:10px;font-weight:800;font-family:'Outfit',sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.4);white-space:nowrap;">
                        ${price > 0 ? `${Math.round(price / 1000)}K` : '??K'}
                    </div>
                    <div style="width:7px;height:7px;margin-top:2px;background:${highlight ? '#10b981' : 'rgba(16,185,129,0.4)'};border-radius:50%;border:${highlight ? '2px solid #fff' : 'none'};"></div>
                </div>
            `;

            el.addEventListener('click', (e) => {
                e.stopPropagation();
                onCourtSelect?.(court);
                map.current?.flyTo({ center: coords, zoom: 15, duration: 1000 });
                if (userLoc) {
                    handleGetDirections(coords);
                }
            });

            el.addEventListener('mouseenter', () => {
                el.style.transform = 'scale(1.2) translateY(-5px)';
                el.style.zIndex = '10';
            });
            el.addEventListener('mouseleave', () => {
                if (court._id !== selectedCourtId && court._id !== hoveredCourtId) {
                    el.style.transform = 'scale(1) translateY(0)';
                    el.style.zIndex = '1';
                }
            });

            const marker = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
                .setLngLat(coords)
                .addTo(map.current!);

            // Popup on hover 
            const photoUrl = court.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=200&fit=crop';
            const address = court.address?.fullAddress || court.address?.district || '';
            if (court.name) {
                const popup = new vietmapgl.Popup({ offset: 35, maxWidth: '240px', closeButton: false, closeOnClick: true })
                    .setHTML(`
                        <div style="margin:-10px -10px -15px;font-family:'Outfit',sans-serif;">
                            ${photoUrl ? `<img src="${photoUrl}" style="width:100%;height:100px;object-fit:cover;border-radius:4px 4px 0 0;" />` : ''}
                            <div style="padding:8px 10px 10px;">
                                <div style="font-weight:800;font-size:13px;color:#111;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${court.name}</div>
                                <div style="font-size:11px;color:#6B7280;margin:2px 0 6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${address}</div>
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <span style="color:#059669;font-weight:900;font-size:13px;">${formatPrice(price)}/h</span>
                                    <span style="font-size:11px;font-weight:700;background:#FEF3C7;color:#B45309;padding:1px 6px;border-radius:4px;">⭐ ${rating}</span>
                                </div>
                            </div>
                        </div>
                    `);
                marker.setPopup(popup);
            }

            markersRef.current.set(court._id, marker);
            markerElementsRef.current.set(court._id, el);
        });

        // Fit bounds logic from Claude
        if (hasCoords && validCourts.length > 1 && !selectedCourtId) {
            map.current.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
        } else if (hasCoords && validCourts.length === 1) {
            const c = getCoords(validCourts[0])!;
            map.current.flyTo({ center: c, zoom: 14, duration: 800 });
        }
    }, [validCourts, selectedCourtId, hoveredCourtId]);

    // 3. Highlight from external hover/select
    useEffect(() => {
        markerElementsRef.current.forEach((el, id) => {
            const highlight = id === selectedCourtId || id === hoveredCourtId;
            el.style.transform = highlight ? 'scale(1.2) translateY(-5px)' : 'scale(1) translateY(0)';
            el.style.zIndex = highlight ? '10' : '1';
        });

        // Pan to selected & attempt route
        if (selectedCourtId) {
            const court = validCourts.find(c => c._id === selectedCourtId);
            if (court) {
                const coords = getCoords(court);
                if (coords) {
                    map.current?.flyTo({ center: coords, zoom: 15, duration: 800 });
                    if (userLoc) handleGetDirections(coords);
                }
            }
        } else {
            clearRoute();
        }
    }, [selectedCourtId, hoveredCourtId]);

    // 4. DRAW RADIUS CIRCLE (From Claude)
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
            id: 'radius-fill',
            type: 'fill',
            source: 'radius-circle',
            paint: { 'fill-color': '#10b981', 'fill-opacity': 0.06 },
        });
        map.current.addLayer({
            id: 'radius-border',
            type: 'line',
            source: 'radius-circle',
            paint: { 'line-color': '#10b981', 'line-width': 1.5, 'line-opacity': 0.3, 'line-dasharray': [4, 4] },
        });

        radiusLayerRef.current = true;
    };

    // 5. LOCATE ME (Triggered via prop or internal logic)
    useEffect(() => {
        if (triggerLocateMe) {
            handleLocateMe();
        }
    }, [triggerLocateMe]);

    const handleLocateMe = () => {
        if (!navigator.geolocation) {
            alert('Trình duyệt không hỗ trợ định vị');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLoc({ lat, lng });

                if (map.current) {
                    map.current.flyTo({ center: [lng, lat], zoom: 14, pitch: 55, duration: 2000 });

                    // User marker
                    if (userMarkerRef.current) userMarkerRef.current.remove();
                    const userEl = document.createElement('div');
                    userEl.innerHTML = `
                        <div style="position:relative;width:22px;height:22px;">
                            <div style="position:absolute;inset:-8px;background:rgba(59,130,246,0.15);border-radius:50%;animation:mapPulse 2s ease-out infinite;"></div>
                            <div style="width:22px;height:22px;background:#2563eb;border-radius:50%;border:3px solid white;box-shadow:0 0 12px rgba(59,130,246,0.6);position:relative;"></div>
                        </div>
                    `;

                    // Inject animation styles if not present
                    if (!document.getElementById('map-pulse-css')) {
                        const style = document.createElement('style');
                        style.id = 'map-pulse-css';
                        style.textContent = `@keyframes mapPulse { 0% { transform: scale(1); opacity: 0.4; } 100% { transform: scale(2.5); opacity: 0; } }`;
                        document.head.appendChild(style);
                    }

                    userMarkerRef.current = new vietmapgl.Marker({ element: userEl, anchor: 'center' })
                        .setLngLat([lng, lat]).addTo(map.current);

                    // Draw 5km radius
                    drawRadiusCircle(lng, lat, 5);
                }
            },
            () => console.warn('Vui lòng cho phép quyền truy cập vị trí!'),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // 6. ROUTING (From Claude)
    const clearRoute = () => {
        try {
            map.current.removeLayer('route-line');
            map.current.removeLayer('route-outline');
            map.current.removeSource('route');
        } catch { /* ignore */ }
    }

    const handleGetDirections = async (courtCoords: [number, number]) => {
        if (!userLoc || !map.current) return;

        try {
            const url = `https://maps.vietmap.vn/api/route?api-version=1.1&apikey=${VIETMAP_KEY}&point=${userLoc.lat},${userLoc.lng}&point=${courtCoords[1]},${courtCoords[0]}&vehicle=car&optimize=true`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.paths && data.paths.length > 0) {
                const path = data.paths[0];
                const routeCoords = decodePolyline(path.points);

                clearRoute();

                map.current.addSource('route', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: { type: 'LineString', coordinates: routeCoords },
                        properties: {},
                    },
                });

                map.current.addLayer({
                    id: 'route-outline',
                    type: 'line',
                    source: 'route',
                    paint: { 'line-color': '#000', 'line-width': 7, 'line-opacity': 0.3 },
                });

                map.current.addLayer({
                    id: 'route-line',
                    type: 'line',
                    source: 'route',
                    paint: { 'line-color': '#10b981', 'line-width': 4, 'line-opacity': 0.9 },
                });

                // Fit to route
                const routeBounds = new vietmapgl.LngLatBounds();
                routeCoords.forEach((c: [number, number]) => routeBounds.extend(c));
                map.current.fitBounds(routeBounds, { padding: { top: 50, bottom: 50, left: 50, right: 400 }, duration: 1500 }); // Padded to avoid covering UI
            }
        } catch (err) {
            console.error('Lỗi routing:', err);
        }
    };


    if (!VIETMAP_KEY) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#121212] text-emerald-400 p-4 text-center rounded-2xl border border-emerald-500/20 shadow-lg">
                <p className="font-bold tracking-wide">Vui lòng cấu hình biến VITE_VIETMAP_KEY trong file .env nhé!</p>
            </div>
        );
    }

    return (
        <div
            ref={mapContainer}
            style={{ width: '100%', height: '100%', borderRadius: '16px', overflow: 'hidden' }}
            className="shadow-2xl border border-[#2a2a2a]"
        />
    );
};

export default MapView;