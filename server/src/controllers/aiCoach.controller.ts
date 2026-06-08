import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const aiCoachController = {
    askCoach: async (req: Request, res: Response) => {
        try {
            const { message } = req.body;
            if (!message) return res.status(400).json({ error: 'Bạn chưa nhập câu hỏi!' });

            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

            const prompt = `
                Bạn là một Huấn luyện viên Cầu lông chuyên nghiệp mang tên "ShuttleSync Coach".
                Nhiệm vụ của bạn là tư vấn kỹ thuật (smash, phông, rớt lưới), luật thi đấu BWF, cách chọn vợt/giày, mức căng cước, và các bài tập thể lực cho người chơi từ phong trào đến bán chuyên.
                Nguyên tắc:
                1. Luôn xưng là "Coach" và gọi người dùng là "bạn" hoặc "vợt thủ".
                2. Trả lời ngắn gọn, súc tích, có ngắt dòng, dùng emoji thể thao cho thân thiện.
                3. NẾU NGƯỜI DÙNG HỎI NGOÀI PHẠM VI CẦU LÔNG, hãy từ chối khéo léo và lái câu chuyện về cầu lông.
                
                QUAN TRỌNG: Bạn BẮT BUỘC phải trả về kết quả dưới định dạng chuỗi JSON hợp lệ với cấu trúc chính xác như sau (không kèm markdown):
                {
                  "reply": "Câu trả lời của bạn ở đây",
                  "suggestions": ["Gợi ý câu hỏi 1", "Gợi ý câu hỏi 2", "Gợi ý câu hỏi 3"]
                }

                Câu hỏi của vợt thủ: "${message}"
            `;

            let result;
            let retries = 3; 

            while (retries > 0) {
                try {
                    result = await model.generateContent(prompt);
                    break;
                } catch (apiError: any) {
                    if (apiError.status === 503 || apiError.status === 429) {
                        console.log(`Google API đang bận (Mã ${apiError.status}), thử lại lần ${4 - retries}...`);
                        retries--;
                        if (retries === 0) {
                            throw new Error('Google API quá tải 3 lần liên tiếp.');
                        }
                        await delay(1500);
                    } else {
                        throw apiError;
                    }
                }
            }
            let responseText = result!.response.text();

            responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

            let responseData;
            try {
                responseData = JSON.parse(responseText);
            } catch (parseError) {
                console.error('Lỗi parse JSON từ AI:', parseError, 'Raw text:', responseText);
                responseData = {
                    reply: responseText,
                    suggestions: []
                };
            }
            res.status(200).json({
                reply: responseData.reply,
                suggestions: responseData.suggestions || []
            });

        } catch (error: any) {
            console.error('Lỗi AI Coach:', error);
            res.status(500).json({
                error: 'Coach đang bận hướng dẫn học viên khác, bạn thử lại sau nhé!',
                details: error?.message || String(error)
            });
        }
    }
};