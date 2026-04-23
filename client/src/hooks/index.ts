import { useMemo, useState, useEffect } from 'react';
import type { Court, CourtFilters } from '../types';

/**
 * Filter + sort courts based on current filters
 */
export function useFilteredCourts(courts: Court[], filters: CourtFilters) {
    return useMemo(() => {
        let result = [...courts];

        // Sport type
        if (filters.sport !== 'all') {
            result = result.filter(c =>
                c.sportTypes.includes(filters.sport as any) || c.sportTypes.includes('both' as any)
            );
        }

        // District
        if (filters.district !== 'Tất cả') {
            result = result.filter(c =>
                c.address.district.toLowerCase().includes(filters.district.toLowerCase())
            );
        }

        // Keyword
        if (filters.keyword) {
            const kw = filters.keyword.toLowerCase();
            result = result.filter(c =>
                c.name.toLowerCase().includes(kw) ||
                c.address.district.toLowerCase().includes(kw) ||
                c.address.fullAddress.toLowerCase().includes(kw)
            );
        }

        // Price range
        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            result = result.filter(c => {
                const minP = Math.min(...c.pricePerHour.flatMap(p => p.timeSlots.map(t => t.pricePerHour)));
                if (filters.minPrice && minP < filters.minPrice) return false;
                if (filters.maxPrice && minP > filters.maxPrice) return false;
                return true;
            });
        }

        // Indoor only
        if (filters.indoorOnly) {
            result = result.filter(c => c.courts.some(sc => sc.isIndoor));
        }

        // Sort
        switch (filters.sortBy) {
            case 'distance':
                result.sort((a, b) => (a.distance ?? 99) - (b.distance ?? 99));
                break;
            case 'rating':
                result.sort((a, b) => b.averageRating - a.averageRating);
                break;
            case 'price_asc':
                result.sort((a, b) => getMinPrice(a) - getMinPrice(b));
                break;
            case 'price_desc':
                result.sort((a, b) => getMinPrice(b) - getMinPrice(a));
                break;
        }

        return result;
    }, [courts, filters]);
}

function getMinPrice(c: Court): number {
    if (!c.pricePerHour.length) return 0;
    return Math.min(...c.pricePerHour.flatMap(p => p.timeSlots.map(t => t.pricePerHour)));
}

/**
 * Responsive breakpoint hook
 */
export function useMediaQuery(query: string) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const mql = window.matchMedia(query);
        setMatches(mql.matches);
        const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
        mql.addEventListener('change', handler);
        return () => mql.removeEventListener('change', handler);
    }, [query]);

    return matches;
}

/**
 * Lock body scroll (for modals/sheets)
 */
export function useLockScroll(locked: boolean) {
    useEffect(() => {
        if (locked) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [locked]);
}