import { useEffect, useState } from 'react';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`glass fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[var(--color-cream)]/85 shadow-[0_1px_0_var(--color-cream-dark)]'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl flex items-center justify-between px-6 h-16">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <img
            src="/bubb-logo.png"
            alt="bubb"
            className="w-8 h-8 transition-transform duration-300 group-hover:scale-110"
          />
          <span className="font-sans text-lg font-semibold text-[var(--color-ink)] tracking-tight">
            bubb
          </span>
        </a>

        {/* Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Pricing
          </a>
          <a
            href="#"
            className="text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Sign In
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-coral)] text-white text-sm font-semibold hover:brightness-110 transition-all shadow-[0_2px_8px_rgba(190,75,65,0.3)]"
          >
            Try bubb
            <span className="text-xs">&#8599;</span>
          </a>
        </div>
      </div>
    </nav>
  );
}
