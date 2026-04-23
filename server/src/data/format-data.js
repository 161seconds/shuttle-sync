const fs = require('fs');
const rawData = require('./dataset_crawler-google-places_2026-04-22_23-35-06-699.json');

// Hàm tạo slug tự động từ tên (vd: "Sân Cầu Lông ABC" -> "san-cau-long-abc")
const createSlug = (text) => {
    return text.toString().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9 -]/g, '') // Bỏ ký tự đặc biệt
        .replace(/\s+/g, '-') // Đổi khoảng trắng thành gạch ngang
        .replace(/-+/g, '-');
};

const formattedCourts = rawData.map((item) => {
    const title = item.title || "";
    const fullAddress = item.address || item.formattedAddress || "Đang cập nhật";

    // Thuật toán "cây nhà lá vườn" để trích xuất Quận/Huyện từ địa chỉ TPHCM
    const districtMatch = fullAddress.match(/(Quận \d+|Quận [A-ZÀ-ỹ\s]+|Huyện [A-ZÀ-ỹ\s]+|Thành phố Thủ Đức)/i);
    const district = districtMatch ? districtMatch[0].trim() : "TP.HCM";

    return {
        name: title,
        slug: createSlug(title),
        description: item.description || `Sân cầu lông ${title} tọa lạc tại ${district}.`,
        sportTypes: title.toLowerCase().includes('pickleball') ? ["pickleball"] : ["badminton"],

        address: {
            fullAddress: fullAddress,
            district: district
        },

        // MongoDB bắt buộc cấu trúc [Longitude, Latitude]
        location: {
            type: "Point",
            coordinates: item.location ? [item.location.lng, item.location.lat] : [106.6297, 10.8231]
        },

        contact: {
            phone: item.phone || item.phoneUnformatted || "",
            website: item.website || ""
        },

        // Dữ liệu đánh giá từ Google
        averageRating: item.totalScore || 0,
        reviewCount: item.reviewsCount || 0,
        googlePlaceId: item.placeId || "",

        // Lấy danh sách ảnh (Giới hạn 5 ảnh để nhẹ DB)
        photos: item.imageUrls ? item.imageUrls.slice(0, 5).map((url, index) => ({
            url: url,
            caption: "Ảnh sân " + title,
            isMain: index === 0, // Ảnh đầu tiên làm ảnh chính
            source: "google"
        })) : [],

        // --- CÁC TRƯỜNG ĐỂ TRỐNG (Không fake data, không user mặc định) ---
        ownerId: null,
        isVerified: false,
        totalBookings: 0,
        amenities: [], // Chủ sân sẽ tự tick sau
        courts: [],    // Không có sân con mặc định
        operatingHours: [],
        pricePerHour: []
    };
});

const validCourts = formattedCourts.filter(c => c.location.coordinates[0] && c.location.coordinates[1]);

fs.writeFileSync('./db_ready_courts.json', JSON.stringify(validCourts, null, 2));
console.log(`✅ Đã biến đổi thành công ${validCourts.length} sân!`);
console.log(`➡️  Mở MongoDB Compass, import file 'db_ready_courts.json' vào Collection 'courts' nhé.`);