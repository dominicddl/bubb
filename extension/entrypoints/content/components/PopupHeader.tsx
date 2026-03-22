import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface PopupHeaderProps {
  highlightedText: string;
  onClose: () => void;
}

export function PopupHeader({ highlightedText, onClose }: PopupHeaderProps) {
  const displayText = highlightedText.length > 80
    ? highlightedText.substring(0, 80) + '...'
    : highlightedText;

  return (
    <div className="flex items-start justify-between gap-[8px] p-[16px] pb-[8px]">
      <p
        className="text-[14px] font-semibold leading-[1.3] text-[hsl(var(--foreground))]"
        style={{ fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif" }}
      >
        {displayText}
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="h-[32px] w-[32px] shrink-0 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent-coral))]"
        onClick={onClose}
        aria-label="Close explanation"
      >
        <X className="h-[16px] w-[16px]" />
      </Button>
    </div>
  );
}
