import { useScrollReveal } from '../hooks/useScrollReveal';

export function Hero() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={ref}
      className="stagger relative pt-32 pb-16 px-6 text-center overflow-hidden"
    >
      {/* Bracket label */}
      <div className="fade-up flex justify-center mb-6">
        <span className="bracket-label inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-green-light)] text-[var(--color-green)] border border-[var(--color-green)]/15">
          [ chrome extension ]
        </span>
      </div>

      {/* Headline */}
      <h1 className="fade-up font-serif text-5xl md:text-7xl font-bold text-[var(--color-ink)] tracking-tight leading-[1.1] max-w-3xl mx-auto">
        Understand anything{' '}
        <span className="italic text-[var(--color-green)]">you read.</span>
      </h1>

      {/* Subheadline */}
      <p className="fade-up mt-6 text-lg md:text-xl text-[var(--color-ink-muted)] max-w-xl mx-auto leading-relaxed">
        Highlight text on any webpage. Get instant, contextual AI explanations
        that build on what you've already learned.
      </p>

      {/* CTAs */}
      <div className="fade-up mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
        <a
          href="#"
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[var(--color-coral)] text-white font-semibold text-base hover:brightness-110 transition-all shadow-[0_4px_16px_rgba(190,75,65,0.35)] hover:shadow-[0_6px_24px_rgba(190,75,65,0.45)] hover:-translate-y-0.5"
        >
          Add to Chrome — it's free
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ml-0.5">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>

      {/* Decorative gradient orb */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-[var(--color-green)]/8 to-transparent blur-3xl pointer-events-none" />
    </section>
  );
}
