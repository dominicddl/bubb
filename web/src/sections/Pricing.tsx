import { useScrollReveal } from '../hooks/useScrollReveal';

const tiers = [
  {
    name: 'Explorer',
    price: '$0',
    period: 'forever',
    description: 'Everything you need to start learning smarter.',
    features: [
      '8 highlights per day',
      'All 3 depth levels',
      'Follow-up questions',
      'Auto-save notes',
      'AI topic organization',
    ],
    cta: 'Get started free',
    featured: false,
  },
  {
    name: 'Learner',
    price: '$8',
    period: '/month',
    description: 'For serious students who never want to stop.',
    features: [
      'Unlimited highlights',
      'Priority streaming speed',
      'Full conversation history',
      'Cross-session context',
      'Everything in Explorer',
    ],
    cta: 'Start learning more',
    featured: true,
  },
];

export function Pricing() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section id="pricing" ref={ref} className="py-24 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <span className="fade-up bracket-label inline-flex px-3 py-1.5 rounded-full bg-[var(--color-coral-light)] text-[var(--color-coral)] border border-[var(--color-coral)]/15 mb-6">
          [ pricing ]
        </span>
        <h2 className="fade-up font-serif text-3xl md:text-5xl font-bold text-[var(--color-ink)] tracking-tight mb-4">
          Start free. Upgrade when you're ready.
        </h2>
        <p className="fade-up text-[var(--color-ink-muted)] mb-16 max-w-lg mx-auto">
          No credit card required. No feature gating — free users get the full experience.
        </p>

        <div className="stagger grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className="fade-up relative rounded-xl p-8 text-left transition-all bg-[var(--color-cream-light)] border border-[var(--color-ink)]/8"
            >
              {tier.featured && (
                <span className="absolute -top-3 right-6 bracket-label px-3 py-1 rounded-full bg-[var(--color-green)] text-white text-[10px]">
                  [ popular ]
                </span>
              )}

              <h3 className="font-sans text-lg font-bold text-[var(--color-ink)] mb-1">{tier.name}</h3>
              <p className="text-sm mb-6 text-[var(--color-ink-muted)]">
                {tier.description}
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-serif text-5xl font-bold tracking-tight">
                  {tier.price}
                </span>
                <span className="text-sm text-[var(--color-ink-faint)]">
                  {tier.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="mt-0.5 shrink-0"
                    >
                      <path
                        d="M4 8l3 3 5-6"
                        stroke="var(--color-green)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span className="text-[var(--color-ink)]">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className="block text-center py-3 rounded-full font-semibold text-sm transition-all bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink)]/90"
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
