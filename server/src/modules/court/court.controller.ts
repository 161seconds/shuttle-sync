import { Request, Response } from 'express';
import { CourtModel } from './court.model.js';

export const getAllCourts = async (req: Request, res: Response) => {
    try {
        const courts = await CourtModel.find();
        res.status(200).json(courts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy dữ liệu sân' });
    }
};

export const createCourt = async (req: Request, res: Response) => {
    try {
        const { name, location, pricePerHour, imageUrl } = req.body;

        const newCourt = await CourtModel.create({
            name,
            location,
            pricePerHour,
            imageUrl
        });

        res.status(201).json({ message: 'Tạo sân thành công', court: newCourt });
    } catch (error: any) {
        console.log("🔥 Lỗi tạo sân:", error); 
        res.status(500).json({
            message: 'Lỗi khi tạo sân',
            detail: error.message // Trả thẳng nguyên nhân về Postman
        });
    }
};