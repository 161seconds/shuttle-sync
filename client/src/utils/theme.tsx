import type { ReactNode } from 'react';
import { EmojiIcon } from '../components/EmojiIcon';

/** ShuttleSync Design Tokens — FULL DARK THEME */
export const theme = {
    bg: {
        base: 'bg-background',
        surface: 'bg-card',
        card: 'bg-card',
        elevated: 'bg-card',
        hover: 'hover:bg-card',
        input: 'bg-card',
    },
    border: {
        subtle: 'border-border',
        muted: 'border-border',
        accent: 'border-emerald-500/20',
        glow: 'border-emerald-400/40',
    },
    text: {
        primary: 'text-foreground',
        secondary: 'text-muted-foreground',
        muted: 'text-muted-foreground',
        accent: 'text-emerald-400',
    },
    glow: {
        sm: 'shadow-glow',
        md: 'shadow-glow-md',
        lg: 'shadow-glow-md',
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
    { id: 'all', label: 'Tất cả', icon: <EmojiIcon name="zap" className="w-4 h-4 inline-block align-text-bottom" /> },
    { id: 'badminton', label: 'Cầu lông', icon: <EmojiIcon name="badminton" className="w-4 h-4 inline-block align-text-bottom" /> },
    { id: 'pickleball', label: 'Pickleball', icon: <EmojiIcon name="pickleball" className="w-4 h-4 inline-block align-text-bottom" /> },
];

export const SORT_OPTIONS = [
    { id: 'distance', label: 'Gần nhất' },
    { id: 'rating', label: 'Đánh giá cao' },
    { id: 'price_asc', label: 'Giá thấp → cao' },
    { id: 'price_desc', label: 'Giá cao → thấp' },
] as const;

export const AMENITY_MAP: Record<string, ReactNode> = {
    wifi: <><EmojiIcon name="wifi" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> Wifi</>,
    parking: <><EmojiIcon name="parking" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> Bãi xe</>,
    shower: <><EmojiIcon name="shower" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> Tắm rửa</>,
    ac: <><EmojiIcon name="ac" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> Máy lạnh</>,
    water: <><EmojiIcon name="water" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> Nước uống</>,
    shop: <><EmojiIcon name="shop" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> Shop</>,
    coach: <><EmojiIcon name="coach" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> HLV</>,
    rental: <><EmojiIcon name="rental" className="w-4 h-4 inline-block mr-1 align-text-bottom"/> Cho thuê</>,
};

export const formatPrice = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${Math.round(n / 1000)}K`;
    return n.toString();
};

export const getGreetingByTime = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
    if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
    if (hour >= 18 && hour < 22) return 'Chào buổi tối';
    return 'Cú đêm chăm chỉ';
};