import { useState, useCallback } from 'react';
import type { UserPreferences } from './type';

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
    const [stored, setStored] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initial;
        } catch { return initial; }
    });
    const setValue = (value: T | ((p: T) => T)) => {
        const val = value instanceof Function ? value(stored) : value;
        setStored(val);
        window.localStorage.setItem(key, JSON.stringify(val));
    };
    return [stored, setValue];
}

export function useOnboarding() {
    const [hasOnboarded, setHasOnboarded] = useLocalStorage('hasOnboarded', false);
    const [preferences, setPreferences] = useLocalStorage<UserPreferences>('userPreferences', {
        sports: [], skillLevel: null, location: '',
    });
    const [showOnboarding, setShowOnboarding] = useState(!hasOnboarded);
    const [showTour, setShowTour] = useState(false);

    const completeOnboarding = useCallback((prefs: UserPreferences) => {
        setPreferences(prefs);
        setHasOnboarded(true);
        setShowOnboarding(false);
        setTimeout(() => setShowTour(true), 600);
    }, [setPreferences, setHasOnboarded]);

    const skipOnboarding = useCallback(() => {
        setHasOnboarded(true);
        setShowOnboarding(false);
    }, [setHasOnboarded]);

    const completeTour = useCallback(() => setShowTour(false), []);

    return { showOnboarding, showTour, preferences, completeOnboarding, skipOnboarding, completeTour };
}