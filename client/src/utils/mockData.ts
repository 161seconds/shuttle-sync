import type { Court } from '../types';

export const MOCK_COURTS: Court[] = [
    {
        _id: '1', name: 'Cầu lông Phú Thọ', slug: 'cau-long-phu-tho',
        ownerId: 'o1', sportTypes: ['badminton'], status: 'active',
        address: { street: '1 Lữ Gia', ward: 'Phường 7', district: 'Quận 11', city: 'Hồ Chí Minh', fullAddress: '1 Lữ Gia, P.7, Q.11, TP.HCM' },
        location: { lat: 10.7645, lng: 106.6537 },
        contact: { phone: '0901234567' },
        amenities: ['wifi', 'parking', 'shower', 'water'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'badminton', timeSlots: [
                { label: 'Sáng', startTime: '06:00', endTime: '11:00', pricePerHour: 100000, daysOfWeek: [1, 2, 3, 4, 5] },
                { label: 'Tối', startTime: '17:00', endTime: '22:00', pricePerHour: 150000, daysOfWeek: [1, 2, 3, 4, 5] },
            ]
        }],
        courts: [
            { _id: 's1', name: 'Sân 1', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
            { _id: 's2', name: 'Sân 2', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
            { _id: 's3', name: 'Sân 3', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
            { _id: 's4', name: 'Sân 4', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 234, averageRating: 4.5, reviewCount: 128, isVerified: true,
        distance: 2.3, isHot: true,
    },
    {
        _id: '2', name: 'Pickleball Saigon Center', slug: 'pickleball-saigon-center',
        ownerId: 'o2', sportTypes: ['pickleball'], status: 'active',
        address: { street: '12 Thảo Điền', ward: 'Phường An Phú', district: 'Quận 2 (Thủ Đức)', city: 'Hồ Chí Minh', fullAddress: '12 Thảo Điền, An Phú, Thủ Đức, TP.HCM' },
        location: { lat: 10.8054, lng: 106.7378 },
        contact: { phone: '0934567890' },
        amenities: ['wifi', 'parking', 'ac', 'coach'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'pickleball', timeSlots: [
                { label: 'Cả ngày', startTime: '06:00', endTime: '22:00', pricePerHour: 150000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
            ]
        }],
        courts: [
            { _id: 's5', name: 'Court A', sportType: 'pickleball', isIndoor: true, surface: 'PVC', isActive: true },
            { _id: 's6', name: 'Court B', sportType: 'pickleball', isIndoor: true, surface: 'PVC', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 189, averageRating: 4.8, reviewCount: 89, isVerified: true,
        distance: 5.1, isHot: true,
    },
    {
        _id: '3', name: 'CLB Cầu lông Quận 7', slug: 'clb-cau-long-quan-7',
        ownerId: 'o1', sportTypes: ['badminton'], status: 'active',
        address: { street: '456 Nguyễn Thị Thập', ward: 'Phường Tân Phong', district: 'Quận 7', city: 'Hồ Chí Minh', fullAddress: '456 Nguyễn Thị Thập, Q.7, TP.HCM' },
        location: { lat: 10.738, lng: 106.7218 },
        contact: { phone: '0923456789' },
        amenities: ['parking', 'water'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'badminton', timeSlots: [
                { label: 'Cả ngày', startTime: '06:00', endTime: '22:00', pricePerHour: 80000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
            ]
        }],
        courts: [
            { _id: 's7', name: 'Sân 1', sportType: 'badminton', isIndoor: false, surface: 'Xi măng', isActive: true },
            { _id: 's8', name: 'Sân 2', sportType: 'badminton', isIndoor: false, surface: 'Xi măng', isActive: true },
            { _id: 's9', name: 'Sân 3', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 87, averageRating: 4.2, reviewCount: 67, isVerified: true,
        distance: 3.8,
    },
    {
        _id: '4', name: 'Tân Bình Sport Center', slug: 'tan-binh-sport-center',
        ownerId: 'o2', sportTypes: ['badminton', 'pickleball'], status: 'active',
        address: { street: '123 Trường Chinh', ward: 'Phường 12', district: 'Tân Bình', city: 'Hồ Chí Minh', fullAddress: '123 Trường Chinh, P.12, Tân Bình, TP.HCM' },
        location: { lat: 10.8021, lng: 106.6374 },
        contact: { phone: '0912345678' },
        amenities: ['wifi', 'parking', 'shower', 'shop'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'badminton', timeSlots: [
                { label: 'Cả ngày', startTime: '06:00', endTime: '22:00', pricePerHour: 120000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
            ]
        }],
        courts: [
            { _id: 's10', name: 'Sân CL-1', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
            { _id: 's11', name: 'Sân CL-2', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
            { _id: 's12', name: 'Sân PB-1', sportType: 'pickleball', isIndoor: false, surface: 'Xi măng', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 312, averageRating: 4.6, reviewCount: 203, isVerified: true,
        distance: 1.5, isHot: true,
    },
    {
        _id: '5', name: 'Nhà thi đấu Rạch Miễu', slug: 'nha-thi-dau-rach-mieu',
        ownerId: 'o1', sportTypes: ['badminton'], status: 'active',
        address: { street: '1 Nguyễn Văn Trỗi', ward: 'Phường 5', district: 'Phú Nhuận', city: 'Hồ Chí Minh', fullAddress: '1 Nguyễn Văn Trỗi, P.5, Phú Nhuận, TP.HCM' },
        location: { lat: 10.7986, lng: 106.6823 },
        contact: { phone: '0907654321' },
        amenities: ['parking', 'shower'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'badminton', timeSlots: [
                { label: 'Cả ngày', startTime: '06:00', endTime: '22:00', pricePerHour: 110000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
            ]
        }],
        courts: [
            { _id: 's13', name: 'Sân A1', sportType: 'badminton', isIndoor: true, surface: 'Gỗ', isActive: true },
            { _id: 's14', name: 'Sân A2', sportType: 'badminton', isIndoor: true, surface: 'Gỗ', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 156, averageRating: 4.3, reviewCount: 156, isVerified: true,
        distance: 4.2,
    },
    {
        _id: '6', name: 'Cầu lông & Pickleball Bình Thạnh', slug: 'cl-pb-binh-thanh',
        ownerId: 'o2', sportTypes: ['badminton', 'pickleball'], status: 'active',
        address: { street: '789 Xô Viết Nghệ Tĩnh', ward: 'Phường 25', district: 'Bình Thạnh', city: 'Hồ Chí Minh', fullAddress: '789 XVNT, P.25, Bình Thạnh, TP.HCM' },
        location: { lat: 10.8059, lng: 106.7115 },
        contact: { phone: '0956789012' },
        amenities: ['parking', 'water', 'rental'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'badminton', timeSlots: [
                { label: 'Cả ngày', startTime: '06:00', endTime: '22:00', pricePerHour: 95000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
            ]
        }],
        courts: [
            { _id: 's15', name: 'Sân CL 1', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
            { _id: 's16', name: 'Sân PB 1', sportType: 'pickleball', isIndoor: true, surface: 'PVC', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 91, averageRating: 4.4, reviewCount: 91, isVerified: true,
        distance: 2.9,
    },
    {
        _id: '7', name: 'Sân cầu lông Gò Vấp', slug: 'san-cau-long-go-vap',
        ownerId: 'o1', sportTypes: ['badminton'], status: 'active',
        address: { street: '321 Phan Văn Trị', ward: 'Phường 10', district: 'Gò Vấp', city: 'Hồ Chí Minh', fullAddress: '321 Phan Văn Trị, P.10, Gò Vấp, TP.HCM' },
        location: { lat: 10.8375, lng: 106.6721 },
        contact: { phone: '0967890123' },
        amenities: ['parking', 'water'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'badminton', timeSlots: [
                { label: 'Cả ngày', startTime: '06:00', endTime: '22:00', pricePerHour: 70000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
            ]
        }],
        courts: [
            { _id: 's17', name: 'Sân 1', sportType: 'badminton', isIndoor: false, surface: 'Xi măng', isActive: true },
            { _id: 's18', name: 'Sân 2', sportType: 'badminton', isIndoor: false, surface: 'Xi măng', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1461896836934-bd45ba8ba86b?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 45, averageRating: 4.0, reviewCount: 45, isVerified: true,
        distance: 6.1,
    },
    {
        _id: '8', name: 'Lãnh Binh Thăng Arena', slug: 'lanh-binh-thang-arena',
        ownerId: 'o2', sportTypes: ['badminton'], status: 'active',
        address: { street: '1 Lãnh Binh Thăng', ward: 'Phường 13', district: 'Quận 11', city: 'Hồ Chí Minh', fullAddress: '1 Lãnh Binh Thăng, P.13, Q.11, TP.HCM' },
        location: { lat: 10.758, lng: 106.6445 },
        contact: { phone: '0945678901' },
        amenities: ['wifi', 'parking', 'shower', 'ac'],
        operatingHours: [{ dayOfWeek: 1, open: '06:00', close: '22:00', isOpen: true }],
        pricePerHour: [{
            sportType: 'badminton', timeSlots: [
                { label: 'Cả ngày', startTime: '06:00', endTime: '22:00', pricePerHour: 130000, daysOfWeek: [1, 2, 3, 4, 5, 6, 0] },
            ]
        }],
        courts: [
            { _id: 's19', name: 'Sân chính 1', sportType: 'badminton', isIndoor: true, surface: 'Gỗ', isActive: true },
            { _id: 's20', name: 'Sân chính 2', sportType: 'badminton', isIndoor: true, surface: 'Gỗ', isActive: true },
            { _id: 's21', name: 'Sân phụ 1', sportType: 'badminton', isIndoor: true, surface: 'PVC', isActive: true },
        ],
        photos: [{ url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=400&h=250&fit=crop', isMain: true, source: 'google' }],
        totalBookings: 278, averageRating: 4.7, reviewCount: 178, isVerified: true,
        distance: 2.0, isHot: true,
    },
];