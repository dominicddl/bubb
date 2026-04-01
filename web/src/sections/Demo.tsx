import { useScrollReveal } from '../hooks/useScrollReveal';

export function Demo() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="demo" ref={ref} className="px-6 pb-20">
      <div className="fade-up mx-auto max-w-4xl">
        {/* Browser chrome frame */}
        <div className="rounded-xl overflow-hidden border border-[var(--color-ink)]/8 shadow-[0_8px_40px_rgba(26,23,20,0.12)]">
          {/* Title bar */}
          <div className="bg-[var(--color-cream-dark)] px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[var(--color-coral)]/60" />
              <div className="w-3 h-3 rounded-full bg-[var(--color-gold)]/60" />
              <div className="w-3 h-3 rounded-full bg-[var(--color-green)]/60" />
            </div>
            <div className="flex-1 mx-8">
              <div className="bg-[var(--color-cream)] rounded-md h-7 flex items-center justify-center">
                <span className="text-xs text-[var(--color-ink-faint)] font-mono">
                  en.wikipedia.org
                </span>
              </div>
            </div>
          </div>

          {/* Video */}
          <div className="bg-[var(--color-cream-light)]">
            <video
              className="w-full aspect-video"
              autoPlay
              muted
              loop
              playsInline
              poster=""
            >
              <source src="/demo.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
