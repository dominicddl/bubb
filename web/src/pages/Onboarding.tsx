import { useState, useEffect, useRef, useCallback } from 'react';

type OnboardingState = 'welcome' | 'all-set';

export function Onboarding() {
  const [state, setState] = useState<OnboardingState>('welcome');

  // Listen for auth state change dispatched by the bubb content script
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.isAuthenticated) {
        setState('all-set');
      }
    };
    document.addEventListener('bubb:auth-changed', handler);
    return () => document.removeEventListener('bubb:auth-changed', handler);
  }, []);

  return (
    <div className="min-h-screen relative bg-[var(--color-cream)] text-[var(--color-ink)]">
      {/* Dot-pattern texture */}
      <div className="dot-pattern absolute inset-0 pointer-events-none" />
      <div className="relative">
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
      style={{ borderBottom: '1px solid var(--color-cream-dark)' }}
    >
      <img src="/bubb-logo.png" alt="bubb" className="w-7 h-7" />
      <p className="font-sans text-[17px] font-semibold tracking-tight text-[var(--color-ink)]">
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

  useEffect(() => {
    if (cursorStopped) return;
    document.fonts.ready.then(() => {
      setTimeout(startAnimation, 300);
    });
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [startAnimation, cursorStopped]);

  const handleParagraphMouseDown = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setCursorStopped(true);
    if (highlightRef.current) {
      highlightRef.current.style.backgroundSize = '0% 100%';
    }
  }, []);

  return (
    <div className="max-w-[600px] mx-auto px-10 pt-14 pb-80 animate-[fadeUp_0.5s_ease-out]">
      <span className="bracket-label inline-block mb-5 text-[var(--color-green)]">
        [ ONBOARDING ]
      </span>

      <h1 className="font-sans text-[30px] leading-[1.12] font-bold mb-1 tracking-tight text-[var(--color-ink)]">
        Understand anything
      </h1>
      <h1 className="font-sans text-[30px] leading-[1.12] font-normal mb-4 tracking-tight text-[var(--color-ink-muted)]">
        you read.
      </h1>

      <p className="font-sans text-[13.5px] leading-[1.7] max-w-[340px] mb-10 text-[var(--color-ink-faint)]">
        Highlight any text to get an instant AI explanation.
        <br />
        Let's try it right now.
      </p>

      {/* Paragraph card */}
      <div
        className="rounded-xl p-7 mb-4"
        style={{ background: 'var(--color-cream-light)', border: '1px solid var(--color-cream-dark)' }}
      >
        <div className="flex items-center gap-2 mb-3.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-coral)]" />
          <span className="bracket-label text-[var(--color-coral)]">
            [ TRY HIGHLIGHTING THIS ]
          </span>
        </div>
        <div className="relative" ref={paragraphRef} onMouseDown={handleParagraphMouseDown}>
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
                fill="var(--color-ink)"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <p
            className="font-sans text-[14.5px] leading-[1.85] m-0"
            style={{ color: 'var(--color-ink)', userSelect: 'text' }}
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
      <p className="text-center font-mono text-[11px] tracking-wide text-[var(--color-ink-faint)]">
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
  const handleStartBrowsing = () => {
    window.close();
  };

  return (
    <div className="max-w-[600px] mx-auto px-10 pt-16 pb-12 text-center animate-[fadeUp_0.5s_ease-out]">
      {/* Success checkmark */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{
          background: 'var(--color-green-light)',
          border: '2px solid var(--color-green)',
        }}
      >
        <span className="text-[26px] text-[var(--color-green)]">✓</span>
      </div>

      <span className="bracket-label inline-block mb-4 text-[var(--color-gold)]">
        [ ALL SET ]
      </span>

      <h1 className="font-sans text-[26px] font-bold mb-2.5 tracking-tight text-[var(--color-ink)]">
        Your first note is saved!
      </h1>

      <p className="font-sans text-[13.5px] leading-[1.7] mb-9 text-[var(--color-ink-faint)]">
        Here's how to use bubb as you browse:
      </p>

      {/* Instructions card */}
      <div
        className="rounded-xl p-7 text-left max-w-[400px] mx-auto mb-8"
        style={{ background: 'var(--color-cream-light)', border: '1px solid var(--color-cream-dark)' }}
      >
        <div className="flex items-start gap-3.5 mb-4.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-cream)', border: '1px solid var(--color-cream-dark)' }}
          >
            <img src="/bubb-logo.png" alt="bubb" className="w-5 h-5" />
          </div>
          <div>
            <p className="font-sans text-[13.5px] font-semibold mb-0.5 text-[var(--color-ink)]">
              Click the bubb icon in your toolbar
            </p>
            <p className="text-[12px] text-[var(--color-ink-faint)]">
              Opens your side panel with saved notes and topics
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--color-cream)', border: '1px solid var(--color-cream-dark)' }}
          >
            <span className="font-mono text-[11px] text-[var(--color-ink-faint)]">Aa</span>
          </div>
          <div>
            <p className="font-sans text-[13.5px] font-semibold mb-0.5 text-[var(--color-ink)]">
              Highlight text on any page
            </p>
            <p className="text-[12px] text-[var(--color-ink-faint)]">
              Works everywhere — articles, blogs, lecture notes
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-[400px] mx-auto">
        <button
          onClick={handleStartBrowsing}
          className="group flex items-center justify-between w-full h-[52px] rounded-xl px-5 transition-opacity hover:opacity-90 mb-3 bg-[var(--color-ink)] text-[var(--color-cream)]"
        >
          <span className="font-sans text-[13px] font-medium">
            Start browsing
          </span>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:translate-x-0.5 bg-[var(--color-coral)]">
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </button>
        <p className="font-mono text-[10px] tracking-wide text-[var(--color-ink-faint)]">
          closes this tab · bubb is ready on every page
        </p>
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
