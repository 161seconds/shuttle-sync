import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axiosClient from '../api/axiosClient';
import PaymentPage from './PaymentPage';

const { showAlert, router, params } = vi.hoisted(() => ({
    showAlert: vi.fn(),
    router: { push: vi.fn() },
    params: { bookingCode: '' },
}));
vi.mock('next/navigation', () => ({ useRouter: () => router, useParams: () => params }));
vi.mock('../api/axiosClient', () => ({ default: { get: vi.fn() } }));
vi.mock('../stores/useAlertStore', () => ({ useAlertStore: () => ({ showAlert }) }));
vi.mock('./Payment', () => ({
    default: ({ amount, onComplete }: { amount: number; onComplete: () => void }) =>
        <button onClick={onComplete}>Pay {amount}</button>,
}));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

function openPayment(code: string) {
    params.bookingCode = code;
    render(<PaymentPage />);
}

describe('payment resumption', () => {
    it('loads every recurring session by groupId and sums its server amount', async () => {
        vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: [
            { bookingCode: 'BK1', groupId: 'GRP123', finalAmount: 100, date: '2026-10-20' },
            { bookingCode: 'BK2', groupId: 'GRP123', finalAmount: 200, date: '2026-10-21' },
            { bookingCode: 'BK3', groupId: 'GRP999', finalAmount: 900, date: '2026-10-21' },
        ] } });
        openPayment('GRP123');
        expect(await screen.findByRole('button', { name: 'Pay 300' })).toBeTruthy();
        expect(axiosClient.get).toHaveBeenCalledWith('/bookings/my?status=pending_payment');
        fireEvent.click(screen.getByRole('button', { name: 'Pay 300' }));
        expect(router.push).toHaveBeenCalledWith('/profile/history');
    });

    it('still resumes an individual booking', async () => {
        vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: [
            { bookingCode: 'BK1', finalAmount: 150, date: '2026-10-20' },
        ] } });
        openPayment('BK1');
        expect(await screen.findByRole('button', { name: 'Pay 150' })).toBeTruthy();
    });

    it('returns unavailable bookings to history without displaying a payment', async () => {
        vi.mocked(axiosClient.get).mockResolvedValue({ data: { data: [] } });
        openPayment('BK404');
        await waitFor(() => expect(router.push).toHaveBeenCalledWith('/profile/history'));
        expect(screen.queryByRole('button')).toBeNull();
    });
});
