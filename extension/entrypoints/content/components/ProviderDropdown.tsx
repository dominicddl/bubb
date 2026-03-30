import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Provider } from '@/lib/messaging';

interface ProviderDropdownProps {
  activeProvider: Provider;
  onProviderChange: (provider: Provider) => void;
  disabled: boolean;
}

const PROVIDERS: { value: Provider; label: string }[] = [
  { value: 'openai', label: 'GPT-4o mini' },
  { value: 'anthropic', label: 'Claude Haiku' },
];

export function ProviderDropdown({ activeProvider, onProviderChange, disabled }: ProviderDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeLabel = PROVIDERS.find(p => p.value === activeProvider)?.label ?? activeProvider;

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    // Listen on the shadow root so clicks inside shadow DOM are captured
    const root = containerRef.current?.getRootNode() as ShadowRoot | Document;
    root.addEventListener('pointerdown', handlePointerDown as EventListener);
    return () => root.removeEventListener('pointerdown', handlePointerDown as EventListener);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => !disabled && setOpen(prev => !prev)}
        disabled={disabled}
        className={`flex items-center gap-[4px] h-[24px] px-[4px] text-[12px] text-[hsl(var(--muted-foreground))] bg-transparent rounded-[4px] transition-colors ${
          disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-[hsl(var(--foreground))] cursor-pointer'
        }`}
      >
        {activeLabel}
        <ChevronDown className="w-[12px] h-[12px]" />
      </button>

      {open && (
        <div
          className="absolute bottom-full right-0 mb-[4px] min-w-[140px] rounded-[8px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_4px_12px_rgba(0,0,0,0.1)] overflow-hidden z-50"
        >
          {PROVIDERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                onProviderChange(value);
                setOpen(false);
              }}
              className={`w-full text-left px-[12px] py-[8px] text-[12px] transition-colors ${
                value === activeProvider
                  ? 'text-[hsl(var(--foreground))] font-medium bg-[hsl(var(--muted))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
