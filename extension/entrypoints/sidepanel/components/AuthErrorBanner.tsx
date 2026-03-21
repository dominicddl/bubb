import { Button } from '@/components/ui/button';
import { AlertCircle, X } from 'lucide-react';

interface AuthErrorBannerProps {
  message: string;
  onRetry: () => void;
  onDismiss: () => void;
  isRetrying: boolean;
}

export function AuthErrorBanner({
  message,
  onRetry,
  onDismiss,
  isRetrying,
}: AuthErrorBannerProps) {
  return (
    <div
      className="rounded-xl p-4 animate-[slideDown_0.2s_ease-out]"
      style={{
        background: 'hsl(0 80% 97%)',
        border: '1px solid hsl(0 60% 90%)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          className="h-4 w-4 mt-0.5 shrink-0"
          style={{ color: 'hsl(0 72% 55%)' }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-[1.5]" style={{ color: 'hsl(0 50% 35%)' }}>
            {message}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
            className="mt-2.5 h-7 text-[11px] rounded-lg border-[hsl(0_60%_85%)] hover:bg-[hsl(0_60%_94%)]"
          >
            {isRetrying ? 'Trying...' : 'Try again'}
          </Button>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 p-1 rounded-md hover:bg-[hsl(0_50%_92%)] transition-colors"
        >
          <X className="h-3 w-3" style={{ color: 'hsl(0 40% 55%)' }} />
        </button>
      </div>

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
