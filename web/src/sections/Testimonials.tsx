import { useScrollReveal } from '../hooks/useScrollReveal';

const testimonials = [
  {
    quote: 'I used to have 15 tabs open for every reading assignment. Now I just highlight and keep going.',
    role: 'Pre-med student',
    color: 'var(--color-green)',
  },
  {
    quote: "The follow-up questions are incredible — it's like having a tutor that remembers everything I've asked before.",
    role: 'CS undergrad',
    color: 'var(--color-coral)',
  },
  {
    quote: 'I finally understand my research papers without spending an hour on each one.',
    role: 'Graduate researcher',
    color: 'var(--color-gold)',
  },
  {
    quote: 'bubb turned my scattered notes into an organized knowledge base automatically. Game changer.',
    role: 'Economics major',
    color: 'var(--color-green)',
  },
];

export function Testimonials() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-24 px-6 bg-[var(--color-cream-dark)]/40">
      <div className="mx-auto max-w-5xl text-center">
        <span className="fade-up bracket-label inline-flex px-3 py-1.5 rounded-full bg-[var(--color-gold-light)] text-[var(--color-gold)] border border-[var(--color-gold)]/15 mb-6">
          [ testimonials ]
        </span>
        <h2 className="fade-up font-serif text-3xl md:text-5xl font-bold text-[var(--color-ink)] tracking-tight mb-16">
          Students love bubb.
        </h2>

        <div className="stagger grid md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.role}
              className="fade-up bg-[var(--color-cream-light)] rounded-xl p-7 text-left border border-[var(--color-ink)]/5 hover:border-[var(--color-ink)]/10 transition-colors"
            >
              {/* Accent bar */}
              <div
                className="w-8 h-1 rounded-full mb-5"
                style={{ backgroundColor: t.color }}
              />
              <p className="text-base text-[var(--color-ink)] leading-relaxed mb-6 font-medium italic">
                "{t.quote}"
              </p>
              <p className="text-xs text-[var(--color-ink-muted)]">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
