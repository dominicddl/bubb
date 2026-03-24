import { SkeletonLoader } from './SkeletonLoader';

interface PopupBodyProps {
  explanationText: string;
  isStreaming: boolean;
  error: string | null;
  isLoading: boolean;
}

export function PopupBody({ explanationText, isStreaming, error, isLoading }: PopupBodyProps) {
  return (
    <div className="px-[16px] py-[8px] overflow-y-auto" style={{ maxHeight: '300px' }}>
      {isLoading && !explanationText && <SkeletonLoader />}
      {error && !explanationText && (
        <div>
          <p className="text-[14px] font-semibold text-[hsl(var(--foreground))]">Something went wrong</p>
          <p className="mt-[4px] text-[14px] leading-[1.6] text-[hsl(var(--muted-foreground))]">
            Could not get an explanation. Try highlighting the text again.
          </p>
        </div>
      )}
      {explanationText && (
        <>
          <p
            className="text-[14px] leading-[1.6] text-[hsl(var(--foreground))]"
            style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}
          >
            {explanationText}
            {isStreaming && (
              <span
                className="inline-block w-[2px] h-[14px] bg-[hsl(var(--foreground))] ml-[1px] align-middle"
                style={{ animation: 'blink-cursor 1s step-end infinite' }}
                aria-hidden="true"
              />
            )}
          </p>
          {error && (
            <p className="mt-[4px] text-[12px] text-[hsl(var(--muted-foreground))]">
              Something went wrong. Retry explanation?
            </p>
          )}
        </>
      )}
    </div>
  );
}
