import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { paymentController } from '../controllers/payment.controller';
import { bookingService } from '../services/booking.service';
import { Booking } from '../models/Booking';

describe('SePay Webhook Verification', () => {
    it('should calculate valid HMAC-SHA256 signature matching SePay specification', () => {
        const secret = 'whsec_g4y6lfBroAv5MdSQbAcljG3T41tDdN6N';
        const timestamp = '1788148721';
        const payload = JSON.stringify({
            gateway: 'MBBank',
            transactionDate: '2026-08-31 10:58:00',
            accountNumber: '08222216167810',
            subAccount: null,
            code: null,
            content: 'O5CH7KD122S5-SHUTTLE BK2648463',
            transferType: 'in',
            description: 'BankAPINotify O5CH7KD122S5-SHUTTLE BK2648463',
            transferAmount: 80000,
            referenceCode: 'FT26243905073088',
            accumulated: 0,
            id: 77940863
        });

        const expectedSig = 'c398748accc607b8156a7ae6ecbe66766cc9c94bc8fec82a4e1019ced2bf5c71';
        const calculatedSig = crypto
            .createHmac('sha256', secret)
            .update(`${timestamp}.${payload}`)
            .digest('hex');

        expect(calculatedSig).toBe(expectedSig);
    });

    it('should successfully handle valid webhook request', async () => {
        process.env.SEPAY_WEBHOOK_SECRET = 'whsec_g4y6lfBroAv5MdSQbAcljG3T41tDdN6N';
        const timestamp = '1788148721';
        const body = {
            gateway: 'MBBank',
            transactionDate: '2026-08-31 10:58:00',
            accountNumber: '08222216167810',
            subAccount: null,
            code: null,
            content: 'O5CH7KD122S5-SHUTTLE BK2648463',
            transferType: 'in',
            description: 'BankAPINotify O5CH7KD122S5-SHUTTLE BK2648463',
            transferAmount: 80000,
            referenceCode: 'FT26243905073088',
            accumulated: 0,
            id: 77940863
        };

        const rawBody = JSON.stringify(body);
        const signature = crypto.createHmac('sha256', process.env.SEPAY_WEBHOOK_SECRET).update(`${timestamp}.${rawBody}`).digest('hex');

        // Mock Booking.findOne
        vi.spyOn(Booking, 'findOne').mockResolvedValue({
            bookingCode: 'BK2648463',
            status: 'pending_payment',
            userId: 'user123',
            finalAmount: 80000
        } as any);

        // Mock bookingService.confirmPayment
        vi.spyOn(bookingService, 'confirmPayment').mockResolvedValue({} as any);

        const req: any = {
            headers: {
                'x-sepay-signature': `sha256=${signature}`,
                'x-sepay-timestamp': timestamp
            },
            body,
            rawBody
        };

        let responseStatus = 0;
        let responseJson: any = null;

        const res: any = {
            status: (code: number) => {
                responseStatus = code;
                return res;
            },
            json: (data: any) => {
                responseJson = data;
                return res;
            }
        };

        await paymentController.handleSePayWebhook(req, res);

        expect(responseStatus).toBe(200);
        expect(responseJson.success).toBe(true);
        expect(bookingService.confirmPayment).toHaveBeenCalledWith('BK2648463', 'user123');
    });
});
