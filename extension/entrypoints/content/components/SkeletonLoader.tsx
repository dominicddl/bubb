export function SkeletonLoader() {
  return (
    <div className="space-y-[4px]">
      <div className="h-[14px] rounded bg-[hsl(var(--muted))] w-full animate-pulse" style={{ animationDuration: '1.5s' }} />
      <div className="h-[14px] rounded bg-[hsl(var(--muted))] w-[83%] animate-pulse" style={{ animationDuration: '1.5s' }} />
      <div className="h-[14px] rounded bg-[hsl(var(--muted))] w-[66%] animate-pulse" style={{ animationDuration: '1.5s' }} />
      <div className="h-[16px]" />
      <div className="h-[14px] rounded bg-[hsl(var(--muted))] w-full animate-pulse" style={{ animationDuration: '1.5s' }} />
      <div className="h-[14px] rounded bg-[hsl(var(--muted))] w-[75%] animate-pulse" style={{ animationDuration: '1.5s' }} />
    </div>
  );
}
