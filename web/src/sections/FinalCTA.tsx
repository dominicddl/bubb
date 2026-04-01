import { useScrollReveal } from '../hooks/useScrollReveal';

export function FinalCTA() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-28 px-6 text-center relative overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[var(--color-green)]/6 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-[var(--color-coral)]/6 blur-3xl pointer-events-none" />

      <div className="relative">
        <img
          src="/bubb-logo.png"
          alt="bubb"
          className="fade-up w-16 h-16 mx-auto mb-8"
        />
        <h2 className="fade-up font-serif text-3xl md:text-5xl font-bold text-[var(--color-ink)] tracking-tight max-w-2xl mx-auto leading-tight mb-6">
          Start understanding everything you read.
        </h2>
        <p className="fade-up text-[var(--color-ink-muted)] mb-10 max-w-md mx-auto">
          Free to use. No account required to start. Install in seconds.
        </p>
        <div className="fade-up">
          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[var(--color-coral)] text-white font-semibold text-lg hover:brightness-110 transition-all shadow-[0_4px_20px_rgba(190,75,65,0.4)] hover:shadow-[0_8px_32px_rgba(190,75,65,0.5)] hover:-translate-y-0.5"
          >
            Add to Chrome — it's free
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="ml-1">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
