import { SkeletonLoader } from './SkeletonLoader';

interface PopupBodyProps {
  explanation: string | null;
  isLoading: boolean;
  error: string | null;
}

export function PopupBody({ explanation, isLoading, error }: PopupBodyProps) {
  return (
    <div className="px-[16px] py-[8px] overflow-y-auto" style={{ maxHeight: '180px' }}>
      {isLoading && <SkeletonLoader />}
      {error && (
        <div>
          <p className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Something went wrong</p>
          <p className="mt-[4px] text-[14px] leading-[1.6] text-[hsl(var(--muted-foreground))]">
            Could not get an explanation. Try highlighting the text again.
          </p>
        </div>
      )}
      {!isLoading && !error && explanation && (
        <p
          className="text-[14px] leading-[1.6] text-[hsl(var(--foreground))]"
          style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}
        >
          {explanation}
        </p>
      )}
    </div>
  );
}
