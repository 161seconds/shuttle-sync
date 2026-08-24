import { describe, it, expect } from 'vitest';

describe('Booking Conflict & Calculation Engine', () => {
    // Thuật toán chuyển đổi giờ HH:mm sang phút
    const timeToMins = (t: string): number => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
    };

    // Thuật toán kiểm tra giao thoa khoảng thời gian
    const isConflicting = (start1: string, end1: string, start2: string, end2: string): boolean => {
        const s1 = timeToMins(start1);
        const e1 = timeToMins(end1);
        const s2 = timeToMins(start2);
        const e2 = timeToMins(end2);
        return s1 < e2 && e1 > s2;
    };

    describe('Interval Intersection (Conflict Checking)', () => {
        it('phải phát hiện trùng lịch khi 2 khung giờ hoàn toàn trùng nhau', () => {
            expect(isConflicting('08:00', '09:30', '08:00', '09:30')).toBe(true);
        });

        it('phải phát hiện trùng lịch khi khung giờ mới nằm lọt trong khung giờ cũ', () => {
            expect(isConflicting('08:00', '11:00', '09:00', '10:00')).toBe(true);
        });

        it('phải phát hiện trùng lịch khi khung giờ mới bao trùm khung giờ cũ', () => {
            expect(isConflicting('09:00', '10:00', '08:00', '11:00')).toBe(true);
        });

        it('phải phát hiện trùng lịch khi giao nhau một phần đầu hoặc cuối', () => {
            expect(isConflicting('08:00', '09:30', '09:00', '10:30')).toBe(true);
            expect(isConflicting('09:00', '10:30', '08:00', '09:30')).toBe(true);
        });

        it('KHÔNG ĐƯỢC tính là trùng lịch nếu 2 khung giờ chỉ liền kề nhau', () => {
            // Khung 1 kết thúc lúc 09:00, khung 2 bắt đầu lúc 09:00
            expect(isConflicting('08:00', '09:00', '09:00', '10:00')).toBe(false);
            expect(isConflicting('09:00', '10:00', '08:00', '09:00')).toBe(false);
        });

        it('KHÔNG ĐƯỢC tính là trùng lịch nếu 2 khung giờ cách xa nhau', () => {
            expect(isConflicting('08:00', '09:00', '14:00', '15:00')).toBe(false);
        });
    });

    describe('Voucher Discount Calculations', () => {
        const calculateVoucherDiscount = (
            totalAmount: number,
            voucher: {
                type: 'PERCENTAGE' | 'FIXED';
                value: number;
                maxDiscount?: number;
                minOrderValue?: number;
            }
        ): number => {
            if (voucher.minOrderValue && totalAmount < voucher.minOrderValue) {
                throw new Error('Đơn hàng chưa đạt giá trị tối thiểu');
            }

            let discount = 0;
            if (voucher.type === 'PERCENTAGE') {
                discount = (totalAmount * voucher.value) / 100;
                if (voucher.maxDiscount && discount > voucher.maxDiscount) {
                    discount = voucher.maxDiscount;
                }
            } else {
                discount = voucher.value;
            }

            return Math.min(discount, totalAmount);
        };

        it('tính đúng giảm giá theo phần trăm không có trần giới hạn', () => {
            const discount = calculateVoucherDiscount(200000, {
                type: 'PERCENTAGE',
                value: 10, // 10%
            });
            expect(discount).toBe(20000);
        });

        it('tính đúng giảm giá theo phần trăm và áp dụng trần maxDiscount', () => {
            const discount = calculateVoucherDiscount(500000, {
                type: 'PERCENTAGE',
                value: 20, // 20% của 500k là 100k, nhưng trần tối đa là 50k
                maxDiscount: 50000,
            });
            expect(discount).toBe(50000);
        });

        it('tính đúng giảm giá cố định (FIXED)', () => {
            const discount = calculateVoucherDiscount(200000, {
                type: 'FIXED',
                value: 30000,
            });
            expect(discount).toBe(30000);
        });

        it('báo lỗi khi đơn hàng chưa đạt minOrderValue', () => {
            expect(() => {
                calculateVoucherDiscount(100000, {
                    type: 'FIXED',
                    value: 20000,
                    minOrderValue: 150000,
                });
            }).toThrow('Đơn hàng chưa đạt giá trị tối thiểu');
        });

        it('không giảm vượt quá tổng tiền của đơn hàng', () => {
            const discount = calculateVoucherDiscount(50000, {
                type: 'FIXED',
                value: 100000,
            });
            expect(discount).toBe(50000);
        });
    });
});
