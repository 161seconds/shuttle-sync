import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Sửa lỗi mất icon mặc định của Leaflet trong React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component con để tự động zoom bản đồ vừa vặn với tất cả các sân
const ChangeView = ({ bounds }: { bounds: L.LatLngBoundsExpression }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
    }, [bounds, map]);
    return null;
};

interface MapViewProps {
    courts: any[]; // Danh sách sân truyền từ API
}

const MapView: React.FC<MapViewProps> = ({ courts }) => {
    // Lọc ra các sân có tọa độ hợp lệ [lng, lat]
    const validCourts = courts.filter(
        (c) => c.location && c.location.coordinates && c.location.coordinates.length === 2
    );

    // Mặc định ở TP.HCM nếu không có sân nào
    const defaultCenter: [number, number] = [10.762622, 106.660172];

    // Tạo khung (bounds) để bản đồ tự zoom vừa tất cả các điểm
    const bounds = validCourts.length > 0
        ? L.latLngBounds(validCourts.map(c => [c.location.coordinates[1], c.location.coordinates[0]]))
        : null;

    return (
        <div style={{ height: '100%', width: '100%', minHeight: '400px', borderRadius: '12px', overflow: 'hidden', zIndex: 1 }}>
            <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                {/* Lớp nền bản đồ miễn phí từ OpenStreetMap */}
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {bounds && <ChangeView bounds={bounds} />}

                {/* Ghim các điểm (Markers) lên bản đồ */}
                {validCourts.map((court) => (
                    <Marker
                        key={court.id}
                        position={[court.location.coordinates[1], court.location.coordinates[0]]} // Leaflet dùng [lat, lng]
                    >
                        <Popup>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold' }}>{court.name}</h3>
                                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                                    {court.address?.fullAddress}
                                </p>
                                {/* Có thể thêm nút "Đặt ngay" hoặc link tới trang chi tiết ở đây */}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default MapView;