import { Button } from '@/components/ui/button';
import type { DepthLevel } from '@/lib/messaging';

interface DepthToggleProps {
  activeDepth: DepthLevel;
  onDepthChange: (depth: DepthLevel) => void;
  errorDepths: Record<DepthLevel, string | null>;
}

const DEPTHS: { key: DepthLevel; label: string }[] = [
  { key: 'simple', label: 'Simple' },
  { key: 'standard', label: 'Standard' },
  { key: 'deep', label: 'Deep' },
];

export function DepthToggle({ activeDepth, onDepthChange, errorDepths }: DepthToggleProps) {
  return (
    <div className="flex gap-[4px] px-[16px] py-[8px]">
      {DEPTHS.map(({ key, label }) => (
        <Button
          key={key}
          variant={activeDepth === key ? 'outline' : 'ghost'}
          className={`h-[28px] px-[10px] text-[12px] font-medium leading-[1.0] transition-colors hover:bg-[hsl(var(--muted))] ${
            activeDepth === key
              ? 'border border-[hsl(var(--muted-foreground))]'
              : 'border border-transparent'
          }`}
          onClick={() => onDepthChange(key)}
        >
          <span className="flex items-center gap-[4px]">
            {label}
            {errorDepths[key] && (
              <span
                className="inline-block w-[6px] h-[6px] rounded-full bg-[hsl(var(--accent-coral))]"
                aria-label="Error loading this depth"
              />
            )}
          </span>
        </Button>
      ))}
    </div>
  );
}
