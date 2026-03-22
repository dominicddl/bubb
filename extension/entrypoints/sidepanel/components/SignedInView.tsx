import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, ArrowRight, BookOpen, Layers, Lightbulb } from 'lucide-react';
import { BubbLogo } from '@/components/BubbLogo';

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
    <div className="flex flex-col min-h-[480px] relative overflow-hidden animate-[fadeIn_0.4s_ease-out]">
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="px-7 pt-8 pb-6">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-2.5">
              <BubbLogo size={28} />
              <p
                className="text-[17px] font-semibold tracking-[-0.01em]"
                style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 16%)' }}
              >
                bubb
              </p>
            </div>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-medium tracking-wide"
              style={{
                background: 'hsl(24 8% 16%)',
                color: 'hsl(33 25% 90%)',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {initials}
            </div>
          </div>

          <span
            className="inline-block text-[10px] font-medium tracking-[0.15em] uppercase mb-3"
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'hsl(var(--accent-green))',
            }}
          >
            [ DASHBOARD ]
          </span>

          <h1
            className="text-[26px] leading-[1.15] font-bold tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 10%)' }}
          >
            Hey, {firstName}.
          </h1>
        </div>

        {/* Stats grid */}
        <div className="px-7 pb-4">
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid hsl(var(--border))' }}
          >
            <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'hsl(var(--border))' }}>
              <StatCell value="0" label="NOTES" accentColor="var(--accent-green)" />
              <StatCell value="0" label="TOPICS" accentColor="var(--accent-gold)" />
              <StatCell value="0" label="PAGES" accentColor="var(--accent-coral)" />
            </div>
          </div>
        </div>

        {/* Action cards */}
        <div className="px-7 pb-6 space-y-3">
          <ActionCard
            icon={<Lightbulb className="w-4 h-4" />}
            label="EXPLAIN"
            accentColor="var(--accent-green)"
            title="Start learning"
            description="Highlight text on any page to get an AI explanation."
          />
          <ActionCard
            icon={<BookOpen className="w-4 h-4" />}
            label="NOTES"
            accentColor="var(--accent-gold)"
            title="Your notes"
            description="Explanations you save will appear here."
          />
          <ActionCard
            icon={<Layers className="w-4 h-4" />}
            label="TOPICS"
            accentColor="var(--accent-coral)"
            title="Topics"
            description="AI-organized topics from your learning."
          />
        </div>

        {/* Footer */}
        <div className="mt-auto px-7 pb-6">
          <div className="h-px w-full mb-4" style={{ background: 'hsl(var(--border))' }} />

          {showConfirm ? (
            <div
              className="rounded-xl p-4 animate-[fadeIn_0.15s_ease-out]"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <p
                className="text-[12px] font-medium mb-3 tracking-[0.02em]"
                style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 8% 28%)' }}
              >
                Sign out of bubb?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-[11px] rounded-lg px-4"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}
                  onClick={() => { setShowConfirm(false); onSignOut(); }}
                >
                  Sign out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] rounded-lg px-4"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 text-[11px] hover:opacity-60 transition-opacity"
              style={{
                color: 'hsl(24 5% 52%)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.03em',
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          )}
        </div>
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

function StatCell({
  value,
  label,
  accentColor,
}: {
  value: string;
  label: string;
  accentColor: string;
}) {
  return (
    <div className="py-4 px-3 text-center" style={{ background: 'hsl(var(--card))' }}>
      <p
        className="text-[22px] font-bold leading-none mb-1.5"
        style={{
          fontFamily: 'var(--font-sans)',
          color: `hsl(${accentColor})`,
        }}
      >
        {value}
      </p>
      <p
        className="text-[8.5px] font-medium tracking-[0.15em] uppercase"
        style={{
          fontFamily: 'var(--font-mono)',
          color: 'hsl(24 5% 52%)',
        }}
      >
        {label}
      </p>
    </div>
  );
}

function ActionCard({
  icon,
  label,
  accentColor,
  title,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  accentColor: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="group rounded-xl p-4 flex items-start gap-3.5 transition-colors cursor-default"
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{
          background: `hsl(${accentColor} / 0.1)`,
          color: `hsl(${accentColor})`,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span
          className="text-[9px] font-medium tracking-[0.15em] uppercase block mb-1"
          style={{
            fontFamily: 'var(--font-mono)',
            color: `hsl(${accentColor})`,
          }}
        >
          [ {label} ]
        </span>
        <p
          className="text-[13px] font-semibold leading-[1.3] mb-0.5"
          style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 14%)' }}
        >
          {title}
        </p>
        <p className="text-[11px] leading-[1.5]" style={{ color: 'hsl(24 5% 52%)' }}>
          {description}
        </p>
      </div>
      <ArrowRight
        className="w-4 h-4 shrink-0 mt-2 opacity-0 group-hover:opacity-40 transition-opacity"
        style={{ color: 'hsl(24 10% 30%)' }}
      />
    </div>
  );
}
