import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface SignedInViewProps {
  userName: string;
  onSignOut: () => void;
}

export function SignedInView({ userName, onSignOut }: SignedInViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  // Extract first name from full name or email
  const firstName = userName.split(' ')[0] || userName.split('@')[0] || 'there';

  return (
    <div className="flex flex-col min-h-[400px] px-6 py-12">
      <div className="flex-1">
        <h1 className="text-2xl font-semibold leading-[1.2] mb-4">
          Hey, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground leading-[1.5]">
          Your learning dashboard is coming in Phase 2.
        </p>
      </div>

      <Separator className="my-4" />

      {showConfirm ? (
        <Alert variant="default" className="bg-secondary">
          <AlertDescription className="text-sm mb-3">
            Sign out of bubb? Local highlights will still work.
          </AlertDescription>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setShowConfirm(false);
                onSignOut();
              }}
            >
              Sign out
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(false)}
            >
              Stay signed in
            </Button>
          </div>
        </Alert>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowConfirm(true)}
          className="self-start text-muted-foreground"
        >
          Sign out
        </Button>
      )}
    </div>
  );
}
