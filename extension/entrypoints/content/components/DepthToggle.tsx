import { Button } from '@/components/ui/button';
import type { DepthLevel } from '@/lib/messaging';

interface DepthToggleProps {
  activeDepth: DepthLevel;
  onDepthChange: (depth: DepthLevel) => void;
  loadingDepths: Record<DepthLevel, boolean>;
  errorDepths: Record<DepthLevel, string | null>;
}

const DEPTHS: { key: DepthLevel; label: string }[] = [
  { key: 'simple', label: 'Simple' },
  { key: 'standard', label: 'Standard' },
  { key: 'deep', label: 'Deep' },
];

export function DepthToggle({ activeDepth, onDepthChange, loadingDepths, errorDepths }: DepthToggleProps) {
  return (
    <div className="flex gap-[4px] px-[16px] py-[8px]">
      {DEPTHS.map(({ key, label }) => (
        <Button
          key={key}
          variant={activeDepth === key ? 'default' : 'outline'}
          className="h-[28px] px-[10px] text-[12px] font-medium leading-[1.0]"
          onClick={() => onDepthChange(key)}
        >
          {loadingDepths[key] ? (
            <span className="flex gap-[2px] items-center">
              <span className="inline-block h-[8px] w-[8px] rounded-[1px] bg-current animate-pulse" />
              <span className="inline-block h-[8px] w-[8px] rounded-[1px] bg-current animate-pulse" style={{ animationDelay: '0.15s' }} />
              <span className="inline-block h-[8px] w-[8px] rounded-[1px] bg-current animate-pulse" style={{ animationDelay: '0.3s' }} />
            </span>
          ) : (
            <span className="flex items-center gap-[4px]">
              {label}
              {errorDepths[key] && (
                <span
                  className="inline-block w-[6px] h-[6px] rounded-full bg-[hsl(var(--accent-coral))]"
                  aria-label="Error loading this depth"
                />
              )}
            </span>
          )}
        </Button>
      ))}
    </div>
  );
}
