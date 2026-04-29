const fs = require('fs');
const rawData = JSON.parse(fs.readFileSync('./courts-raw.json', 'utf8'));

const transformData = rawData.map(item => {
    // 1. Phân loại lại Thể thao (Badminton / Pickleball / Tennis)
    let sports = [];
    const rawCat = (item.categories || []).join(' ').toLowerCase();
    const rawName = (item.title || "").toLowerCase();

    if (rawCat.includes('pickleball') || rawName.includes('pickleball')) sports.push('PICKLEBALL');
    if (rawCat.includes('cầu lông') || rawCat.includes('badminton') || rawName.includes('cầu lông') || rawName.includes('badminton')) sports.push('BADMINTON');
    if (rawCat.includes('tennis') || rawCat.includes('quần vợt') || rawName.includes('tennis')) sports.push('TENNIS');

    // Nếu không nhận diện được thì tạm để là PICKLEBALL cho đỡ lỗi
    if (sports.length === 0) sports.push('PICKLEBALL');

    // 2. Tạo object chuẩn theo cấu trúc mới
    return {
        name: item.title || "Chưa cập nhật tên",
        ownerId: null,
        googlePlaceId: null,
        location: {
            type: 'Point',
            coordinates: [0, 0] // Tạm để 0,0 - sau này map với Google sẽ update
        },
        address: {
            street: item.street || "",
            state: item.state || "",
            city: item.city || "",
            countryCode: item.countryCode || "VN"
        },
        contact: {
            phone: item.phone || "",
            website: item.website || ""
        },
        sports: sports,
        rating: {
            totalScore: item.totalScore || 0,
            reviewsCount: item.reviewsCount || 0
        },
        isActive: true
    };
});

// Ghi ra file mới
fs.writeFileSync('./venues-clean.json', JSON.stringify(transformData, null, 4));
console.log(`Đã dọn dẹp xong ${transformData.length} sân!`);
console.log(`File mới đã được tạo tại: server/src/data/venues-clean.json`);