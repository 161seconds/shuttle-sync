import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './theme-provider';
import { useOnboarding } from '../features/onboarding/useOnboarding';

afterEach(() => {
    cleanup();
    localStorage.clear();
});

function Preferences() {
    const { theme } = useTheme();
    const { showOnboarding } = useOnboarding();
    return <p>{theme}:{String(showOnboarding)}</p>;
}

describe('browser preferences', () => {
    it('renders consistent server defaults, then restores saved browser preferences', async () => {
        localStorage.setItem('vite-ui-theme', 'dark');
        localStorage.setItem('hasOnboarded', 'true');
        let html: string;
        vi.stubGlobal('window', undefined);
        vi.stubGlobal('localStorage', undefined);
        try {
            html = renderToString(<ThemeProvider><Preferences /></ThemeProvider>);
        } finally {
            vi.unstubAllGlobals();
        }
        const container = document.createElement('div');
        container.innerHTML = html;
        expect(container.textContent).toBe('light:false');
        document.body.appendChild(container);
        render(<ThemeProvider><Preferences /></ThemeProvider>, { container, hydrate: true });
        await waitFor(() => expect(screen.getByText('dark:false')).toBeTruthy());
    });

    it('shows onboarding for a new visitor and keeps dismissal', async () => {
        const { result } = renderHook(() => useOnboarding());
        await waitFor(() => expect(result.current.showOnboarding).toBe(true));
        act(() => result.current.skipOnboarding());
        expect(result.current.showOnboarding).toBe(false);
        expect(localStorage.getItem('hasOnboarded')).toBe('true');
    });
});
