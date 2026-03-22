import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';

interface SaveToastProps {
  noteId: string | null;
  isSignedIn: boolean;
  onUndo: () => void;
  onLogin: () => void;
  onRetrySave: () => void;
  saveError: boolean;
}

export function SaveToast({ noteId, isSignedIn, onUndo, onLogin, onRetrySave, saveError }: SaveToastProps) {
  const [visible, setVisible] = useState(true);
  const [undone, setUndone] = useState(false);

  useEffect(() => {
    if (!isSignedIn || saveError) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [isSignedIn, saveError]);

  if (!visible || undone) return null;

  if (!isSignedIn) {
    return (
      <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-[16px] py-[8px]">
        <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Sign in to save notes</span>
        <button
          onClick={onLogin}
          className="text-[12px] font-medium text-[hsl(var(--accent-coral))] hover:underline"
        >
          Log in to save
        </button>
      </div>
    );
  }

  if (saveError) {
    return (
      <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-[16px] py-[8px]">
        <span className="text-[12px] text-[hsl(var(--muted-foreground))]">Could not save note</span>
        <button
          onClick={onRetrySave}
          className="text-[12px] font-medium text-[hsl(var(--accent-coral))] hover:underline"
        >
          Retry save
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-[hsl(var(--border))] px-[16px] py-[8px]">
      <span className="flex items-center gap-[4px] text-[12px] text-[hsl(var(--accent-green))]">
        <Check className="h-[14px] w-[14px]" />
        Note saved
      </span>
      <button
        onClick={() => {
          onUndo();
          setUndone(true);
        }}
        className="text-[12px] font-medium text-[hsl(var(--accent-coral))] hover:underline"
      >
        Undo save
      </button>
    </div>
  );
}
