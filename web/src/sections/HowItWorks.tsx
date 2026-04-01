import { useScrollReveal } from '../hooks/useScrollReveal';

const steps = [
  {
    number: '01',
    title: 'Highlight',
    description: 'Select any confusing text on any webpage.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect x="4" y="14" width="24" height="6" rx="2" fill="var(--color-green)" opacity="0.2"/>
        <path d="M6 17h20" stroke="var(--color-green)" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Understand',
    description: 'Get an instant AI explanation at the depth you choose.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="10" stroke="var(--color-coral)" strokeWidth="2.5" fill="none"/>
        <path d="M16 12v5l3 3" stroke="var(--color-coral)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Remember',
    description: 'Everything saves automatically, building your knowledge base.',
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M8 8h16v18l-8-4-8 4V8z" stroke="var(--color-gold)" strokeWidth="2.5" strokeLinejoin="round" fill="none"/>
      </svg>
    ),
  },
];

export function HowItWorks() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-24 px-6 bg-[var(--color-cream-dark)]/40">
      <div className="mx-auto max-w-5xl text-center">
        <span className="fade-up bracket-label inline-flex px-3 py-1.5 rounded-full bg-[var(--color-cream-dark)] text-[var(--color-ink-faint)] border border-[var(--color-ink)]/6 mb-6">
          [ how it works ]
        </span>
        <h2 className="fade-up font-serif text-3xl md:text-5xl font-bold text-[var(--color-ink)] tracking-tight mb-16">
          Three steps. Zero friction.
        </h2>

        <div className="stagger grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="fade-up group relative bg-[var(--color-cream-light)] rounded-xl p-8 border border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/12 transition-all hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(26,23,20,0.08)]"
            >
              {/* Step number */}
              <div className="font-mono text-5xl font-bold text-[var(--color-ink)]/6 absolute top-4 right-5">
                {step.number}
              </div>

              <div className="mb-5">{step.icon}</div>
              <h3 className="font-sans text-xl font-bold text-[var(--color-ink)] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
