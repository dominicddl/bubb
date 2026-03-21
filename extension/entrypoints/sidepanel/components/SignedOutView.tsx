import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface SignedOutViewProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export function SignedOutView({ onSignIn, isLoading }: SignedOutViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] px-6 py-12">
      <Badge variant="secondary" className="mb-6">
        Preview mode — sign in to save your learning
      </Badge>

      <h1 className="text-2xl font-semibold leading-[1.2] text-center mb-4">
        Welcome to bubb
      </h1>

      <p className="text-sm text-muted-foreground text-center mb-8 max-w-[260px] leading-[1.5]">
        Sign in with your Google account to save explanations and sync across devices.
      </p>

      <Button
        onClick={onSignIn}
        disabled={isLoading}
        className="min-h-[44px] w-full max-w-[260px]"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in with Google'
        )}
      </Button>
    </div>
  );
}
