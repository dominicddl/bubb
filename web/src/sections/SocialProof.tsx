import { useScrollReveal } from '../hooks/useScrollReveal';

const universities = [
  'Stanford',
  'MIT',
  'UC Berkeley',
  'Georgia Tech',
  'Carnegie Mellon',
];

export function SocialProof() {
  const ref = useScrollReveal<HTMLElement>();

  return (
    <section ref={ref} className="py-12 px-6 border-y border-[var(--color-ink)]/5">
      <div className="fade-up mx-auto max-w-4xl text-center">
        <p className="text-sm font-medium text-[var(--color-ink-faint)] uppercase tracking-wider mb-6">
          Trusted by students at
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {universities.map((name) => (
            <span
              key={name}
              className="text-lg font-serif font-semibold text-[var(--color-ink)]/25 select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
