import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Khởi tạo Gemini bằng API Key
const genAI = new GoogleGenerativeAI('process.env.GEMINI_API_KEY');

export const aiCoachController = {
    askCoach: async (req: Request, res: Response) => {
        try {
            const { message } = req.body;
            if (!message) return res.status(400).json({ error: 'Bạn chưa nhập câu hỏi!' });

            const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

            const prompt = `
                Bạn là một Huấn luyện viên Cầu lông chuyên nghiệp mang tên "ShuttleSync Coach".
                Nhiệm vụ của bạn là tư vấn kỹ thuật (smash, phông, rớt lưới), luật thi đấu BWF, cách chọn vợt/giày, mức căng cước, và các bài tập thể lực cho người chơi từ phong trào đến bán chuyên.
                Nguyên tắc:
                1. Luôn xưng là "Coach" và gọi người dùng là "bạn" hoặc "vợt thủ".
                2. Trả lời ngắn gọn, súc tích, có ngắt dòng, dùng emoji thể thao cho thân thiện.
                3. NẾU NGƯỜI DÙNG HỎI NGOÀI PHẠM VI CẦU LÔNG, hãy từ chối khéo léo và lái câu chuyện về cầu lông.
                
                Câu hỏi của vợt thủ: "${message}"
            `;

            // Gọi AI xử lý
            const result = await model.generateContent(prompt);
            const responseText = result.response.text();

            res.status(200).json({ reply: responseText });
        } catch (error) {
            console.error('Lỗi AI Coach:', error);
            res.status(500).json({ error: 'Coach đang bận hướng dẫn học viên khác, bạn thử lại sau nhé!' });
        }
    }
};