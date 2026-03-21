import { Loader2 } from 'lucide-react';

interface SignedOutViewProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export function SignedOutView({ onSignIn, isLoading }: SignedOutViewProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[480px] px-8 py-16 relative overflow-hidden">
      {/* Warm ambient glow */}
      <div
        className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full opacity-[0.08] blur-[90px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle, hsl(24 80% 55%), hsl(340 50% 50%))',
          animation: 'breathe 8s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center animate-[fadeUp_0.6s_ease-out]">
        {/* Logo */}
        <p
          className="text-[22px] italic mb-12 tracking-[0.01em]"
          style={{ fontFamily: 'var(--font-serif)', color: 'hsl(24 10% 20%)' }}
        >
          bubb
        </p>

        <h1
          className="text-[32px] leading-[1.15] text-center mb-4 font-normal"
          style={{ fontFamily: 'var(--font-serif)', color: 'hsl(24 10% 14%)' }}
        >
          Understand anything<br />
          <em className="font-normal">you read</em>
        </h1>

        <p
          className="text-[13.5px] text-center mb-10 max-w-[250px] leading-[1.65]"
          style={{ color: 'hsl(24 6% 48%)' }}
        >
          Highlight text on any page. Get instant,
          contextual explanations that build on what you already know.
        </p>

        {/* Google sign-in button */}
        <button
          onClick={onSignIn}
          disabled={isLoading}
          className="group relative flex items-center justify-center gap-3 w-full max-w-[260px] h-[50px] rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: 'hsl(24 8% 16%)',
            color: 'hsl(30 25% 95%)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'hsl(30 20% 85%)' }} />
              <span className="text-[13.5px] font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                Signing in...
              </span>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#8b9cf7"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#8bc9a0"/>
                <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#e8c36e"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#d48a7e"/>
              </svg>
              <span className="text-[13.5px] font-medium" style={{ fontFamily: 'var(--font-sans)' }}>
                Continue with Google
              </span>
            </>
          )}
        </button>

        <p
          className="mt-8 text-[11px] text-center max-w-[200px] leading-[1.6]"
          style={{ color: 'hsl(24 5% 60%)' }}
        >
          Sign in to save explanations &amp; sync across devices
        </p>
      </div>

      <style>{`
        @keyframes breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.08; }
          50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.12; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
