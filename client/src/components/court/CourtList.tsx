import { Search, Grid3X3, List } from 'lucide-react';
import { theme as t } from '../../utils/theme';
import CourtCard from './CourtCard';
import { CourtCardSkeleton } from '../ui/Skeleton';
import type { Court } from '../../types';

interface CourtListProps {
    courts: Court[];
    loading?: boolean;
    viewMode?: 'grid' | 'list';
    onViewModeChange?: (mode: 'grid' | 'list') => void;
}

export default function CourtList({ courts, loading, viewMode = 'grid', onViewModeChange }: CourtListProps) {
    const gridClass = viewMode === 'grid'
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        : 'grid-cols-1';

    return (
        <div>
            {/* Results header */}
            <div className="flex items-center justify-between py-4">
                <p className={`text-xs font-medium ${t.text.muted}`}>
                    {loading ? 'Đang tải...' : `${courts.length} sân được tìm thấy`}
                </p>
                {onViewModeChange && (
                    <div className="flex gap-1">
                        {([['grid', Grid3X3], ['list', List]] as const).map(([mode, Icon]) => (
                            <button
                                key={mode}
                                onClick={() => onViewModeChange(mode)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${viewMode === mode ? 'bg-emerald-500/15 text-emerald-400' : `${t.bg.elevated} ${t.text.muted}`
                                    }`}
                                aria-label={`${mode} view`}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Loading skeletons */}
            {loading ? (
                <div className={`grid gap-4 ${gridClass}`}>
                    {Array.from({ length: 8 }).map((_, i) => <CourtCardSkeleton key={i} />)}
                </div>
            ) : courts.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-20">
                    <Search className={`w-12 h-12 ${t.text.muted} mb-4`} />
                    <p className={`${t.text.secondary} font-semibold mb-1`}>Không tìm thấy sân</p>
                    <p className={`text-xs ${t.text.muted}`}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            ) : (
                /* Court grid */
                <div className={`grid gap-4 ${gridClass}`}>
                    {courts.map((court, i) => (
                        <CourtCard key={court._id} court={court} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
}