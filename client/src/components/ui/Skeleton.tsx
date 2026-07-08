import { theme as t } from '../../utils/theme';

export function Skeleton({ className = '' }: { className?: string }) {
    return (
        <div
            className={`rounded-xl bg-linear-to-r from-muted via-border to-muted bg-size[200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] ${className}`}
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

export function NewsCardSkeleton() {
    return (
        <div className="relative rounded-3xl bg-card border border-border/50 overflow-hidden shadow-lg p-5">
            <div className="flex gap-4">
                <Skeleton className="w-[100px] h-[100px] md:w-[120px] md:h-[120px] rounded-2xl shrink-0" />
                <div className="flex-1 space-y-3 py-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-[90%]" />
                    <Skeleton className="h-4 w-[70%]" />
                    <div className="flex justify-between items-center pt-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                </div>
            </div>
        </div>
    );
}