import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { BubbLogo } from '@/components/BubbLogo';
import { MessageType } from '@/lib/messaging';

type OnboardingState = 'welcome' | 'all-set';

export default function App() {
  const [state, setState] = useState<OnboardingState>('welcome');

  // Listen for auth state changes from background
  useEffect(() => {
    const listener = (message: { type: string; payload?: { isAuthenticated?: boolean } }) => {
      if (message.type === MessageType.AUTH_STATE_CHANGED && message.payload?.isAuthenticated) {
        setState('all-set');
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{ background: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}
    >
      {/* Dot-pattern texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='20' cy='20' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-10">
        <Header />
        {state === 'welcome' ? <WelcomeState /> : <AllSetState />}
      </div>
    </div>
  );
}

function Header() {
  return (
    <div
      className="flex items-center gap-2.5 px-10 py-5"
      style={{ borderBottom: '1px solid hsl(var(--border))' }}
    >
      <BubbLogo size={28} />
      <p
        className="text-[17px] font-semibold tracking-[-0.01em]"
        style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 16%)' }}
      >
        bubb
      </p>
    </div>
  );
}

function WelcomeState() {
  const paragraphRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<SVGSVGElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<number | null>(null);
  const [cursorStopped, setCursorStopped] = useState(false);

  // Animated cursor logic
  const startAnimation = useCallback(() => {
    const wrapper = paragraphRef.current;
    const cursor = cursorRef.current;
    const target = highlightRef.current;
    if (!wrapper || !cursor || !target) return;

    const CYCLE_MS = 5000;

    function easeInOut(t: number) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    let startTime: number | null = null;

    function step(timestamp: number) {
      if (!wrapper || !cursor || !target) return;

      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % CYCLE_MS;
      const progress = elapsed / CYCLE_MS;

      const wrapperRect = wrapper.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const aboveX = targetRect.left - wrapperRect.left - 10;
      const aboveY = targetRect.top - wrapperRect.top - 30;
      const dragStartX = targetRect.left - wrapperRect.left - 2;
      const dragStartY = targetRect.top - wrapperRect.top + targetRect.height / 2 - 2;
      const dragEndX = targetRect.right - wrapperRect.left + 4;
      const dragEndY = dragStartY;

      if (progress < 0.08) {
        const t = progress / 0.08;
        cursor.style.opacity = String(t);
        cursor.style.left = aboveX + 'px';
        cursor.style.top = aboveY + 'px';
      } else if (progress < 0.18) {
        const t = easeInOut((progress - 0.08) / 0.1);
        cursor.style.opacity = '1';
        cursor.style.left = (aboveX + (dragStartX - aboveX) * t) + 'px';
        cursor.style.top = (aboveY + (dragStartY - aboveY) * t) + 'px';
      } else if (progress < 0.50) {
        const t = easeInOut((progress - 0.18) / 0.32);
        cursor.style.opacity = '1';
        cursor.style.left = (dragStartX + (dragEndX - dragStartX) * t) + 'px';
        cursor.style.top = (dragStartY + (dragEndY - dragStartY) * t) + 'px';
        // Sync highlight sweep
        target.style.backgroundSize = (t * 100) + '% 100%';
      } else if (progress < 0.60) {
        cursor.style.opacity = '1';
        cursor.style.left = dragEndX + 'px';
        cursor.style.top = dragEndY + 'px';
        target.style.backgroundSize = '100% 100%';
      } else if (progress < 0.70) {
        const t = (progress - 0.60) / 0.10;
        cursor.style.opacity = String(1 - t);
        cursor.style.left = dragEndX + 'px';
        cursor.style.top = dragEndY + 'px';
        target.style.backgroundSize = (100 - t * 100) + '% 100%';
      } else {
        cursor.style.opacity = '0';
        target.style.backgroundSize = '0% 100%';
      }

      animationRef.current = requestAnimationFrame(step);
    }

    animationRef.current = requestAnimationFrame(step);
  }, []);

  // Start animation after fonts load
  useEffect(() => {
    if (cursorStopped) return;
    document.fonts.ready.then(() => {
      setTimeout(startAnimation, 300);
    });
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [startAnimation, cursorStopped]);

  // Stop cursor on mousedown inside paragraph
  const handleParagraphMouseDown = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCursorStopped(true);
    // Reset highlight
    if (highlightRef.current) {
      highlightRef.current.style.backgroundSize = '0% 100%';
    }
  }, []);

  return (
    <div className="max-w-[600px] mx-auto px-10 pt-14 pb-12 animate-[fadeUp_0.5s_ease-out]">
      <span
        className="inline-block text-[10px] font-medium tracking-[0.15em] uppercase mb-5"
        style={{ fontFamily: 'var(--font-mono)', color: 'hsl(var(--accent-green))' }}
      >
        [ ONBOARDING ]
      </span>

      <h1
        className="text-[30px] leading-[1.12] font-bold mb-1 tracking-[-0.02em]"
        style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 10% 10%)' }}
      >
        Understand anything
      </h1>
      <h1
        className="text-[30px] leading-[1.12] font-normal mb-4 tracking-[-0.02em]"
        style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 8% 32%)' }}
      >
        you read.
      </h1>

      <p
        className="text-[13.5px] leading-[1.7] max-w-[340px] mb-10"
        style={{ color: 'hsl(24 6% 46%)', fontFamily: 'var(--font-sans)' }}
      >
        Highlight any text to get an instant AI explanation.
        <br />
        Let's try it right now.
      </p>

      {/* Paragraph card */}
      <div
        className="rounded-xl p-7 mb-4"
        style={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
      >
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'hsl(var(--accent-coral))' }} />
          <span
            className="text-[9px] font-medium tracking-[0.15em] uppercase"
            style={{ fontFamily: 'var(--font-mono)', color: 'hsl(var(--accent-coral))' }}
          >
            [ TRY HIGHLIGHTING THIS ]
          </span>
        </div>
        <div className="relative" ref={paragraphRef} onMouseDown={handleParagraphMouseDown}>
          {/* Animated cursor */}
          {!cursorStopped && (
            <svg
              ref={cursorRef}
              className="absolute pointer-events-none z-10"
              style={{ width: 18, height: 22, opacity: 0, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.15))' }}
              viewBox="0 0 20 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M5.5 0L5.5 17.5L9.3 13.7L13.2 21.5L15.8 20.3L11.9 12.5L17 12.5L5.5 0Z"
                fill="hsl(24 10% 15%)"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <p
            className="text-[14.5px] leading-[1.85] m-0"
            style={{ color: 'hsl(24 8% 28%)', fontFamily: 'var(--font-sans)', userSelect: 'text' }}
          >
            Every time you open a maps app, you're relying on Einstein's{' '}
            <span
              ref={highlightRef}
              style={{
                background: 'linear-gradient(to right, hsl(4 58% 58% / 0.18), hsl(4 58% 58% / 0.18))',
                backgroundSize: '0% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'left',
                borderRadius: '2px',
                padding: '1px 0',
              }}
            >
              general theory of relativity
            </span>{' '}
            without knowing it. GPS satellites orbit Earth at about 20,000 km above the surface, where
            gravity is weaker — causing their onboard clocks to tick 38 microseconds faster per day than
            clocks on the ground. Without correcting for this, your position would drift by roughly 10
            kilometers each day, making navigation essentially useless.
          </p>
        </div>
      </div>

      {/* Hint */}
      <p
        className="text-center text-[11px]"
        style={{ fontFamily: 'var(--font-mono)', color: 'hsl(24 6% 58%)', letterSpacing: '0.02em' }}
      >
        ↑ try selecting any text above
      </p>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function AllSetState() {
  return <div>All set placeholder</div>;
}
