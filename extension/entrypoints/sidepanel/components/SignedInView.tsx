import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Sparkles } from 'lucide-react';

interface SignedInViewProps {
  userName: string;
  onSignOut: () => void;
}

export function SignedInView({ userName, onSignOut }: SignedInViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const firstName = userName.split(' ')[0] || userName.split('@')[0] || 'there';

  const parts = userName.split(' ');
  const initials = parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : userName.slice(0, 2).toUpperCase();

  return (
    <div className="flex flex-col min-h-[480px] animate-[fadeIn_0.4s_ease-out]">
      {/* Header */}
      <div className="px-6 pt-10 pb-6">
        <div className="flex items-center gap-3.5 mb-8">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-medium tracking-wide shrink-0"
            style={{
              background: 'hsl(24 8% 16%)',
              color: 'hsl(30 25% 90%)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-[26px] leading-[1.15] font-normal truncate"
              style={{ fontFamily: 'var(--font-serif)', color: 'hsl(24 10% 14%)' }}
            >
              Hey, {firstName}
            </h1>
          </div>
        </div>

        {/* Dashboard card */}
        <div
          className="rounded-2xl p-5"
          style={{
            background: 'hsl(30 20% 98%)',
            border: '1px solid hsl(30 15% 90%)',
          }}
        >
          <div className="flex items-center gap-2.5 mb-3">
            <Sparkles className="w-4 h-4" style={{ color: 'hsl(24 60% 48%)' }} />
            <p
              className="text-[14px]"
              style={{ fontFamily: 'var(--font-serif)', color: 'hsl(24 10% 18%)' }}
            >
              Ready to learn
            </p>
          </div>
          <p
            className="text-[12.5px] leading-[1.7]"
            style={{ color: 'hsl(24 5% 50%)' }}
          >
            Highlight text on any page to get AI explanations.
            Your notes and topics will appear here.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto px-6 pb-6">
        <div className="h-px w-full mb-4" style={{ background: 'hsl(30 12% 90%)' }} />

        {showConfirm ? (
          <div
            className="rounded-xl p-4 animate-[fadeIn_0.15s_ease-out]"
            style={{ background: 'hsl(30 15% 94%)' }}
          >
            <p
              className="text-[13px] mb-3"
              style={{ fontFamily: 'var(--font-serif)', color: 'hsl(24 8% 28%)' }}
            >
              Sign out of bubb?
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="h-8 text-[12px] rounded-full px-4"
                onClick={() => { setShowConfirm(false); onSignOut(); }}
              >
                Sign out
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-[12px] rounded-full px-4"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 text-[12px] hover:opacity-60 transition-opacity"
            style={{ color: 'hsl(24 5% 52%)' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
