import { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';

interface UndoToastProps {
  message: string;
  durationMs?: number;
  onUndo: () => void;
  onExpire: () => void;
}

export function UndoToast({ message, durationMs = 5000, onUndo, onExpire }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onExpire();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationMs, onExpire]);

  return (
    <div
      className="absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-lg px-3 py-2.5 shadow-lg animate-[slideUp_150ms_ease-out]"
      style={{
        background: 'hsl(var(--foreground))',
        color: 'hsl(var(--background))',
        zIndex: 50,
      }}
    >
      <span className="text-[12px] font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
        {message}
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded hover:opacity-80 transition-opacity shrink-0 ml-2"
        style={{
          color: 'hsl(var(--accent-coral))',
          fontFamily: 'var(--font-mono)',
        }}
      >
        <Undo2 className="w-3 h-3" />
        Undo
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-[2px] rounded-b-lg transition-all"
        style={{
          width: `${progress}%`,
          background: 'hsl(var(--accent-coral))',
        }}
      />
    </div>
  );
}
