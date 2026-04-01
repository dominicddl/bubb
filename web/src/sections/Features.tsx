import { useScrollReveal } from '../hooks/useScrollReveal';

const features = [
  {
    label: '[ explain ]',
    color: 'green',
    title: 'Instant understanding, in context.',
    description:
      'Highlight any text on any webpage. Get a layered AI explanation — simple, detailed, or deep — without ever leaving the page.',
    video: '/explain-mini.mp4',
  },
  {
    label: '[ save ]',
    color: 'gold',
    title: 'Every insight, automatically saved.',
    description:
      'Each explanation becomes a note in your personal knowledge base. AI suggests topics to organize everything — no manual filing needed.',
    video: '/save-mini.mp4',
  },
  {
    label: '[ learn ]',
    color: 'coral',
    title: 'Knowledge that compounds.',
    description:
      "bubb remembers what you've learned. Follow-up questions build on previous explanations, creating cumulative understanding across sessions.",
    video: '/learn-mini.mp4',
  },
];

const colorMap: Record<string, string> = {
  green: 'text-[var(--color-green)] bg-[var(--color-green-light)] border-[var(--color-green)]/15',
  gold: 'text-[var(--color-gold)] bg-[var(--color-gold-light)] border-[var(--color-gold)]/15',
  coral: 'text-[var(--color-coral)] bg-[var(--color-coral-light)] border-[var(--color-coral)]/15',
};

function FeatureRow({ f, reversed }: { f: typeof features[number]; reversed: boolean }) {
  const ref = useScrollReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`stagger flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-16`}
    >
      <div className="fade-up flex-1 text-left">
        <span
          className={`bracket-label inline-flex px-3 py-1.5 rounded-full border mb-4 ${colorMap[f.color]}`}
        >
          {f.label}
        </span>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-ink)] tracking-tight leading-tight mb-4">
          {f.title}
        </h2>
        <p className="text-base text-[var(--color-ink-muted)] leading-relaxed max-w-md">
          {f.description}
        </p>
      </div>
      <div className="fade-up flex-1 w-full max-w-lg">
        <div className="rounded-xl overflow-hidden border border-[var(--color-ink)]/6 shadow-[0_4px_24px_rgba(26,23,20,0.06)]">
          <video
            className="w-full"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={f.video} type="video/mp4" />
          </video>
        </div>
      </div>
    </div>
  );
}

export function Features() {
  return (
    <section id="features" className="py-24 px-6">
      <div className="mx-auto max-w-5xl space-y-28">
        {features.map((f, i) => (
          <FeatureRow key={f.label} f={f} reversed={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}
