/** ShuttleSync Design Tokens — FULL DARK THEME */
export const theme = {
    bg: {
        base: 'bg-[#0a0a0a]',
        surface: 'bg-[#111111]',
        card: 'bg-[#151515]',
        elevated: 'bg-[#1a1a1a]',
        hover: 'hover:bg-[#1e1e1e]',
        input: 'bg-[#1a1a1a]',
    },
    border: {
        subtle: 'border-[#1e1e1e]',
        muted: 'border-[#2a2a2a]',
        accent: 'border-emerald-500/20',
        glow: 'border-emerald-400/40',
    },
    text: {
        primary: 'text-[#eaeaea]',
        secondary: 'text-[#999]',
        muted: 'text-[#555]',
        accent: 'text-emerald-400',
    },
    glow: {
        sm: 'shadow-[0_0_12px_rgba(16,185,129,0.15)]',
        md: 'shadow-[0_0_24px_rgba(16,185,129,0.2)]',
        lg: 'shadow-[0_0_40px_rgba(16,185,129,0.25)]',
    },
    ring: {
        accent: 'ring-emerald-500/30',
    },
} as const;

export const DISTRICTS = [
    'Tất cả', 'Quận 1', 'Quận 3', 'Quận 5', 'Quận 7', 'Quận 10', 'Quận 11',
    'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'Bình Tân',
    'Quận 2 (Thủ Đức)',
];

export const SPORT_FILTERS = [
    { id: 'all', label: 'Tất cả', icon: '⚡' },
    { id: 'badminton', label: 'Cầu lông', icon: '🏸' },
    { id: 'pickleball', label: 'Pickleball', icon: '🏓' },
] as const;

export const SORT_OPTIONS = [
    { id: 'distance', label: 'Gần nhất' },
    { id: 'rating', label: 'Đánh giá cao' },
    { id: 'price_asc', label: 'Giá thấp → cao' },
    { id: 'price_desc', label: 'Giá cao → thấp' },
] as const;

export const AMENITY_MAP: Record<string, string> = {
    wifi: '📶', parking: '🅿️', shower: '🚿', ac: '❄️',
    water: '💧', shop: '🛒', coach: '👨‍🏫', rental: '🎒',
};

export const formatPrice = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
};