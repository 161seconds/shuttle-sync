export default function Loading() {
  return (
    <div role="status" aria-label="Đang tải" className="flex min-h-[50vh] items-center justify-center">
      <div className="h-8 w-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
    </div>
  );
}
