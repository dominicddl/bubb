import { Loader2, ArrowRight } from 'lucide-react';
import { BubbLogo } from '@/components/BubbLogo';

interface SignedOutViewProps {
  onSignIn: () => void;
  isLoading: boolean;
}

export function SignedOutView({ onSignIn, isLoading }: SignedOutViewProps) {
  return (
    <div className="flex flex-col min-h-[480px] relative overflow-hidden">
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header with logo */}
        <div className="px-7 pt-10 pb-2">
          <div className="flex items-center gap-2.5">
            <BubbLogo size={28} />
            <p
              className="text-[17px] font-semibold tracking-[-0.01em]"
              style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 16%)' }}
            >
              bubb
            </p>
          </div>
        </div>

        {/* Hero section */}
        <div className="px-7 pt-8 pb-6 animate-[fadeUp_0.5s_ease-out]">
          <span
            className="inline-block text-[10px] font-medium tracking-[0.15em] uppercase mb-5"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'hsl(var(--accent-green))',
            }}
          >
            [ LEARN ]
          </span>

          <h1
            className="text-[30px] leading-[1.12] font-bold mb-4 tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 10%)' }}
          >
            Understand anything
            <br />
            <span className="font-normal" style={{ color: 'hsl(24 8% 32%)' }}>you read.</span>
          </h1>

          <p
            className="text-[13.5px] leading-[1.7] max-w-[280px]"
            style={{ color: 'hsl(24 6% 46%)', fontFamily: 'var(--font-sans)' }}
          >
            Highlight text on any page. Get instant, contextual
            AI explanations that build on what you already know.
          </p>
        </div>

        {/* Feature cards */}
        <div className="px-7 pb-8 animate-[fadeUp_0.6s_ease-out_0.1s_both]">
          <div className="grid grid-cols-2 gap-3">
            <FeatureCard
              label="EXPLAIN"
              accentColor="var(--accent-green)"
              title="Contextual explanations"
              description="Layered depth, tailored to you"
            />
            <FeatureCard
              label="SAVE"
              accentColor="var(--accent-gold)"
              title="Auto-saved notes"
              description="Build a knowledge base"
            />
          </div>
        </div>

        {/* CTA area */}
        <div className="mt-auto px-7 pb-8 animate-[fadeUp_0.7s_ease-out_0.2s_both]">
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="group relative flex items-center justify-between w-full h-[52px] rounded-xl px-5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              background: 'hsl(24 8% 16%)',
              color: 'hsl(33 26% 95%)',
            }}
          >
            {isLoading ? (
              <div className="flex items-center gap-3 mx-auto">
                <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'hsl(33 20% 80%)' }} />
                <span
                  className="text-[13px] font-medium"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  Signing in...
                </span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#8b9cf7"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#8bc9a0"/>
                    <path d="M3.964 10.706A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#e8c36e"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="#d48a7e"/>
                  </svg>
                  <span
                    className="text-[13px] font-medium"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    Continue with Google
                  </span>
                </div>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-0.5"
                  style={{ background: 'hsl(var(--accent-coral))' }}
                >
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </>
            )}
          </button>

          <p
            className="mt-5 text-[11px] text-center leading-[1.6]"
            style={{
              color: 'hsl(24 5% 58%)',
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.02em',
            }}
          >
            Sign in to save explanations &amp; sync across devices
          </p>
        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({
  label,
  accentColor,
  title,
  description,
}: {
  label: string;
  accentColor: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-xl p-4 relative"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <span
        className="text-[9px] font-medium tracking-[0.15em] uppercase block mb-2.5"
        style={{
          fontFamily: 'var(--font-mono)',
          color: `hsl(${accentColor})`,
        }}
      >
        [ {label} ]
      </span>
      <p
        className="text-[13px] font-semibold leading-[1.3] mb-1"
        style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 14%)' }}
      >
        {title}
      </p>
      <p
        className="text-[11px] leading-[1.5]"
        style={{ color: 'hsl(24 5% 52%)' }}
      >
        {description}
      </p>
    </div>
  );
}
