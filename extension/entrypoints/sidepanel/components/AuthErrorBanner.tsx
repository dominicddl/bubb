import { Alert, AlertDescription } from '@/components/ui/alert';
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
    <Alert
      variant="destructive"
      className="relative border-l-4 border-l-destructive bg-secondary mb-4"
    >
      <div className="flex items-start gap-2">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
        <AlertDescription className="flex-1 text-sm">
          {message}
        </AlertDescription>
        <button
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 p-1 rounded-sm hover:bg-muted"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <div className="mt-2 ml-6">
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying}
        >
          {isRetrying ? 'Trying...' : 'Try again'}
        </Button>
      </div>
    </Alert>
  );
}
