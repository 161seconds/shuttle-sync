import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import PaymentPage from './PaymentPage';

const { showAlert } = vi.hoisted(() => ({ showAlert: vi.fn() }));
vi.mock('../api/axiosClient', () => ({ default: { get: vi.fn() } }));
vi.mock('../stores/useAlertStore', () => ({ useAlertStore: () => ({ showAlert }) }));
vi.mock('./Payment', () => ({
    default: ({ amount, onComplete }: { amount: number; onComplete: () => void }) =>
        <button onClick={onComplete}>Pay {amount}</button>,
}));

afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

function openPayment(code: string) {
    render(<MemoryRouter initialEntries={[`/payment/${code}`]}>
        <Routes>
            <Route path="/payment/:bookingCode" element={<PaymentPage />} />
            <Route path="/profile/history" element={<p>Booking history</p>} />
        </Routes>
    </MemoryRouter>);
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
        expect(await screen.findByText('Booking history')).toBeTruthy();
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
        await waitFor(() => expect(screen.queryByText('Booking history')).toBeTruthy());
        expect(screen.queryByRole('button')).toBeNull();
    });
});
