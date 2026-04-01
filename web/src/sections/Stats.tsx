import { useScrollReveal } from '../hooks/useScrollReveal';

const stats = [
  {
    value: '3x',
    label: 'faster comprehension',
    color: 'var(--color-green)',
  },
  {
    value: '100%',
    label: 'context retained',
    color: 'var(--color-coral)',
  },
  {
    value: '\u221E',
    label: 'pages supported',
    color: 'var(--color-gold)',
  },
];

export function Stats() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-16 px-6 border-y border-[var(--color-ink)]/5">
      <div className="stagger mx-auto max-w-4xl grid grid-cols-3 gap-8 text-center">
        {stats.map((stat) => (
          <div key={stat.label} className="fade-up">
            <div
              className="font-serif text-5xl md:text-6xl font-bold tracking-tight"
              style={{ color: stat.color }}
            >
              {stat.value}
            </div>
            <p className="mt-2 text-sm text-[var(--color-ink-muted)] font-medium">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
