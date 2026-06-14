import { 
    Flame, Trophy, Medal, Users, Star, MapPin, Calendar, Zap, 
    Wifi, CircleParking, Bath, Snowflake, Droplet, ShoppingBag, 
    GraduationCap, Briefcase 
} from 'lucide-react';

export const BadmintonIcon = ({ className = "w-5 h-5 inline-block align-text-bottom", style }: { className?: string, style?: any }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        <g transform="rotate(45 12 12)">
            {/* Đế bần (Cork) */}
            <path d="M9 17 C9 22 15 22 15 17 Z" fill="currentColor" fillOpacity="0.2" />
            {/* Tán lông (Skirt) */}
            <path d="M9 17 L4 5 C9 3 15 3 20 5 L15 17" />
            {/* Các vành đai ngang */}
            <line x1="6.5" y1="11" x2="17.5" y2="11" />
            <line x1="8" y1="14" x2="16" y2="14" />
            {/* Các sống dọc của lông */}
            <line x1="12" y1="17" x2="12" y2="4" />
            <line x1="10.5" y1="17" x2="7.5" y2="4.3" />
            <line x1="13.5" y1="17" x2="16.5" y2="4.3" />
        </g>
    </svg>
);

export const PickleballIcon = ({ className = "w-5 h-5 inline-block align-text-bottom", style }: { className?: string, style?: any }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
        {/* Quả bóng Pickleball (Wiffle ball) */}
        <circle cx="6.5" cy="6.5" r="3.5" />
        <g fill="currentColor" stroke="none">
            <circle cx="6.5" cy="5" r="0.6" />
            <circle cx="5" cy="6.5" r="0.6" />
            <circle cx="8" cy="6.5" r="0.6" />
            <circle cx="6.5" cy="8" r="0.6" />
        </g>
        
        {/* Vợt Pickleball */}
        <g transform="rotate(45 12 12)">
            {/* Cán vợt */}
            <rect x="10.5" y="14" width="3" height="8" rx="1" />
            <line x1="10.5" y1="16" x2="13.5" y2="17" />
            <line x1="10.5" y1="19" x2="13.5" y2="20" />
            
            {/* Mặt vợt */}
            <rect x="7" y="3" width="10" height="11" rx="4" fill="currentColor" fillOpacity="0.2" />
        </g>
    </svg>
);

export function EmojiIcon({ name, className = "w-4 h-4 inline-block align-text-bottom", style }: { name: string, className?: string, style?: any }) {
    switch(name) {
        case 'badminton': return <BadmintonIcon className={className} style={style} />;
        case 'pickleball': return <PickleballIcon className={className} style={style} />;
        case 'fire': return <Flame className={className} style={style} />;
        case 'trophy': return <Trophy className={className} style={style} />;
        case 'medal': return <Medal className={className} style={style} />;
        case 'users': return <Users className={className} style={style} />;
        case 'star': return <Star className={className} style={style} />;
        case 'location': return <MapPin className={className} style={style} />;
        case 'calendar': return <Calendar className={className} style={style} />;
        case 'zap': return <Zap className={className} style={style} />;
        case 'wifi': return <Wifi className={className} style={style} />;
        case 'parking': return <CircleParking className={className} style={style} />;
        case 'shower': return <Bath className={className} style={style} />;
        case 'ac': return <Snowflake className={className} style={style} />;
        case 'water': return <Droplet className={className} style={style} />;
        case 'shop': return <ShoppingBag className={className} style={style} />;
        case 'coach': return <GraduationCap className={className} style={style} />;
        case 'rental': return <Briefcase className={className} style={style} />;
        default: return null;
    }
}
