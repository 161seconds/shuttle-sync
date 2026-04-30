import React, { useEffect, useRef, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { formatPrice } from '../utils/theme';

interface MapViewProps {
    courts: any[];
}

const MapView: React.FC<MapViewProps> = ({ courts }) => {
    const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<maplibregl.Map | null>(null);
    const markersRef = useRef<maplibregl.Marker[]>([]);

    // Lọc sân có tọa độ hợp lệ
    const validCourts = useMemo(() => {
        return courts.filter(
            (c) => c.location && c.location.coordinates && c.location.coordinates.length === 2
        );
    }, [courts]);

    const defaultCenter = validCourts.length > 0
        ? [validCourts[0].location.coordinates[0], validCourts[0].location.coordinates[1]]
        : [106.660172, 10.762622];

    useEffect(() => {
        if (!mapContainer.current || !MAPTILER_KEY) return;

        // 1. KHỞI TẠO BẢN ĐỒ (Chỉ chạy 1 lần)
        if (!map.current) {
            map.current = new maplibregl.Map({
                container: mapContainer.current,
                style: `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
                center: defaultCenter as [number, number],
                zoom: 12.5,
                pitch: 45, // Hiệu ứng 3D nghiêng
            });
            map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');
        }

        // 2. XÓA MARKER CŨ MỖI KHI DANH SÁCH SÂN THAY ĐỔI
        markersRef.current.forEach(marker => marker.remove());
        markersRef.current = [];

        // 3. VẼ MARKER & POPUP MỚI
        validCourts.forEach((court) => {
            // -- Tạo HTML cho cây kim (Marker) --
            const markerEl = document.createElement('div');
            markerEl.className = 'custom-marker';
            markerEl.innerHTML = `
        <div style="cursor: pointer; transition: transform 0.3s; transform-origin: bottom;">
          <div style="background-color: #10b981; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(16,185,129,0.6); border: 2.5px solid #1e1e1e;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </div>
          <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #10b981; margin: -2px auto 0;"></div>
        </div>
      `;
            // Hiệu ứng phóng to khi rê chuột
            markerEl.addEventListener('mouseenter', () => markerEl.style.transform = 'scale(1.2) translateY(-5px)');
            markerEl.addEventListener('mouseleave', () => markerEl.style.transform = 'scale(1) translateY(0)');

            // -- Tạo HTML cho Popup --
            const photoUrl = court.photos?.[0]?.url || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=200&fit=crop';
            const price = court.pricePerHour?.[0]?.timeSlots?.[0]?.pricePerHour || 0;
            const rating = court.averageRating?.toFixed(1) || '5.0';
            const address = court.address?.fullAddress || court.address?.district || 'Chưa cập nhật địa chỉ';

            const popup = new maplibregl.Popup({ offset: 45, maxWidth: '260px' })
                .setHTML(`
          <div style="margin: -10px -10px -15px -10px;"> <!-- CSS trick tràn viền popup -->
            <img src="${photoUrl}" style="width: 100%; height: 120px; object-fit: cover; border-top-left-radius: 4px; border-top-right-radius: 4px; margin-bottom: 8px;" />
            <div style="padding: 0 12px 12px 12px;">
              <h3 style="font-weight: bold; font-size: 15px; color: #111827; margin: 0 0 4px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${court.name}</h3>
              <p style="font-size: 12px; color: #6B7280; margin: 0 0 12px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${address}</p>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #059669; font-weight: 900; font-size: 14px;">${formatPrice(price)}/h</span>
                <span style="font-size: 12px; font-weight: bold; background-color: #FEF3C7; color: #B45309; padding: 2px 8px; border-radius: 4px;">⭐ ${rating}</span>
              </div>
            </div>
          </div>
        `);

            // -- Gắn Marker và Popup lên Map --
            const marker = new maplibregl.Marker({ element: markerEl, anchor: 'bottom' })
                .setLngLat([court.location.coordinates[0], court.location.coordinates[1]])
                .setPopup(popup)
                .addTo(map.current!);

            markersRef.current.push(marker);
        });

    }, [validCourts, defaultCenter, MAPTILER_KEY]);

    if (!MAPTILER_KEY) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-[#121212] text-emerald-400 p-4 text-center rounded-2xl border border-emerald-500/20 shadow-lg">
                <p className="font-bold tracking-wide">Vui lòng cấu hình biến VITE_MAPTILER_KEY trong file .env nhé!</p>
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