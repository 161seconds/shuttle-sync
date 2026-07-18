import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { Voucher, VoucherStatus, DiscountType } from '../models/Voucher';

class VoucherController {
    // [ADMIN] Lấy tất cả voucher
    async getAllVouchers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const vouchers = await Voucher.find()
                .populate('venueId', 'name')
                .populate('ownerId', 'displayName email')
                .sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: vouchers });
        } catch (error) {
            next(error);
        }
    }

    // [ADMIN] Duyệt/Từ chối Voucher
    async approveVoucher(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (![VoucherStatus.APPROVED, VoucherStatus.REJECTED].includes(status)) {
                return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
            }

            const voucher = await Voucher.findByIdAndUpdate(
                id,
                { status },
                { new: true }
            );

            if (!voucher) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
            }

            res.status(200).json({ success: true, data: voucher, message: 'Cập nhật trạng thái thành công' });
        } catch (error) {
            next(error);
        }
    }

    // [ADMIN] Tạo mã Global (Không thuộc sân nào)
    async createGlobalVoucher(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const voucher = await Voucher.create({
                ...req.body,
                venueId: null,
                ownerId: req.userId,
                status: VoucherStatus.APPROVED // Admin tạo là tự động duyệt
            });
            res.status(201).json({ success: true, data: voucher, message: 'Tạo mã hệ thống thành công' });
        } catch (error) {
            next(error);
        }
    }

    // [OWNER] Lấy danh sách Voucher của sân
    async getOwnerVouchers(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const vouchers = await Voucher.find({ ownerId: req.userId }).sort({ createdAt: -1 });
            res.status(200).json({ success: true, data: vouchers });
        } catch (error) {
            next(error);
        }
    }

    // [OWNER] Yêu cầu tạo Voucher (Pending)
    async requestVoucher(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { venueId } = req.body;
            if (!venueId) {
                return res.status(400).json({ success: false, message: 'Thiếu thông tin cơ sở' });
            }

            const voucher = await Voucher.create({
                ...req.body,
                ownerId: req.userId,
                status: VoucherStatus.PENDING
            });
            res.status(201).json({ success: true, data: voucher, message: 'Đã gửi yêu cầu cấp mã thành công' });
        } catch (error) {
            next(error);
        }
    }

    // [ADMIN/OWNER] Cập nhật Voucher
    async updateVoucher(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const voucher = await Voucher.findById(id);

            if (!voucher) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
            }

            // Phân quyền: Owner chỉ sửa mã của mình, Admin sửa được hết
            if (req.userRole !== 'admin' && voucher.ownerId?.toString() !== req.userId?.toString()) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền sửa mã này' });
            }

            // Nếu Owner sửa mã, chuyển lại trạng thái PENDING
            const updates = req.body;
            if (req.userRole === 'court_owner') {
                updates.status = VoucherStatus.PENDING;
            }

            const updatedVoucher = await Voucher.findByIdAndUpdate(id, updates, { new: true });
            res.status(200).json({ success: true, data: updatedVoucher, message: 'Cập nhật thành công' });
        } catch (error) {
            next(error);
        }
    }

    // [ADMIN/OWNER] Xoá Voucher
    async deleteVoucher(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const voucher = await Voucher.findById(id);

            if (!voucher) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
            }

            if (req.userRole !== 'admin' && voucher.ownerId?.toString() !== req.userId?.toString()) {
                return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa mã này' });
            }

            await Voucher.findByIdAndDelete(id);
            res.status(200).json({ success: true, message: 'Xóa thành công' });
        } catch (error) {
            next(error);
        }
    }

    // [PUBLIC/USER] Kiểm tra Voucher hợp lệ
    async validateVoucher(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const { code, venueId, totalAmount } = req.body;

            const voucher = await Voucher.findOne({ 
                code: code.toUpperCase(),
                isActive: true,
                status: VoucherStatus.APPROVED
            });

            if (!voucher) {
                return res.status(400).json({ success: false, message: 'Mã không tồn tại hoặc chưa được duyệt' });
            }

            const now = new Date();
            if (now < voucher.startDate || now > voucher.endDate) {
                return res.status(400).json({ success: false, message: 'Mã đã hết hạn hoặc chưa tới thời gian áp dụng' });
            }

            if (voucher.usedCount >= voucher.usageLimit) {
                return res.status(400).json({ success: false, message: 'Mã đã hết lượt sử dụng' });
            }

            if (voucher.venueId && voucher.venueId.toString() !== venueId) {
                return res.status(400).json({ success: false, message: 'Mã không áp dụng cho cơ sở này' });
            }

            if (voucher.minOrderValue && totalAmount < voucher.minOrderValue) {
                return res.status(400).json({ success: false, message: `Đơn hàng tối thiểu ${voucher.minOrderValue.toLocaleString()}đ để áp dụng` });
            }

            // Tính toán mức giảm để preview
            let discountAmount = 0;
            if (voucher.discountType === DiscountType.PERCENTAGE) {
                discountAmount = (totalAmount * voucher.discountValue) / 100;
                if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
                    discountAmount = voucher.maxDiscount;
                }
            } else {
                discountAmount = voucher.discountValue;
            }

            if (discountAmount > totalAmount) discountAmount = totalAmount;

            res.status(200).json({ 
                success: true, 
                data: {
                    voucher,
                    discountAmount
                },
                message: 'Áp dụng mã thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

export const voucherController = new VoucherController();
