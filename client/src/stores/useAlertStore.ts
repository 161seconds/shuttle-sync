import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertState {
    isOpen: boolean;
    title: string;
    message: string;
    type: AlertType;
    isConfirm: boolean;
    onConfirm: (() => void) | null;
    
    showAlert: (message: string, title?: string, type?: AlertType) => void;
    showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
    closeAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
    isOpen: false,
    title: 'Thông báo',
    message: '',
    type: 'info',
    isConfirm: false,
    onConfirm: null,

    showAlert: (message, title = 'Thông báo', type = 'info') => set({
        isOpen: true,
        message,
        title,
        type,
        isConfirm: false,
        onConfirm: null
    }),

    showConfirm: (message, onConfirm, title = 'Xác nhận') => set({
        isOpen: true,
        message,
        title,
        type: 'warning',
        isConfirm: true,
        onConfirm
    }),

    closeAlert: () => set({ isOpen: false })
}));
