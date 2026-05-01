import { theme as t } from '../../utils/theme';

export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-xl bg-linear-to-r from-[#1a1a1a] via-[#222] to-[#1a1a1a] bg-size[200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] ${className}`}
        />
    );
}

export function CourtCardSkeleton() {
    return (
        <div className={`${t.bg.card} rounded-2xl border ${t.border.subtle} overflow-hidden`}>
            <Skeleton className="h-40 rounded-none! rounded-t-2xl!" />
            <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </div>
    );
}

export function ListCardSkeleton() {
    return (
        <div className={`flex gap-4 p-3 rounded-2xl ${t.bg.card} border ${t.border.subtle}`}>
            <Skeleton className="w-24 h-24 shrink-0" />
            <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
            </div>
        </div>
    );
}