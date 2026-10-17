import { useState, useCallback, useEffect } from 'react';
import type { UserPreferences } from './type';

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void, boolean] {
    const [stored, setStored] = useState<T>(initial);
    const [ready, setReady] = useState(false);
    useEffect(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (item) setStored(JSON.parse(item));
        } catch { /* Keep defaults if saved preferences are unavailable. */ }
        setReady(true);
    }, [key]);
    const setValue = (value: T | ((p: T) => T)) => {
        const val = value instanceof Function ? value(stored) : value;
        setStored(val);
        window.localStorage.setItem(key, JSON.stringify(val));
    };
    return [stored, setValue, ready];
}

export function useOnboarding() {
    const [hasOnboarded, setHasOnboarded, ready] = useLocalStorage('hasOnboarded', false);
    const [preferences, setPreferences] = useLocalStorage<UserPreferences>('userPreferences', {
        sports: [], skillLevel: null, location: '',
    });
    const [showOnboarding, setShowOnboarding] = useState(false);
    useEffect(() => { if (ready) setShowOnboarding(!hasOnboarded); }, [hasOnboarded, ready]);
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
