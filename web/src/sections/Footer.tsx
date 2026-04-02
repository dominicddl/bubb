import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-ink)]/5 py-12 px-6">
      <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-start justify-between gap-10">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <img src="/bubb-logo.png" alt="bubb" className="w-7 h-7" />
          <span className="font-sans text-base font-semibold text-[var(--color-ink)] tracking-tight">
            bubb
          </span>
        </div>

        {/* Columns */}
        <div className="flex gap-20">
          <div>
            <h4 className="bracket-label text-[var(--color-ink-faint)] mb-4">
              [ product ]
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#features" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                  Features
                </a>
              </li>
<li>
                <Link to="/privacy" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="bracket-label text-[var(--color-ink-faint)] mb-4">
              [ connect ]
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://x.com/cabddl" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="https://github.com/dominicddl" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://www.linkedin.com/in/dominic-cabansay" target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors">
                  LinkedIn
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl mt-10 pt-6 border-t border-[var(--color-ink)]/5 text-center">
        <p className="text-xs text-[var(--color-ink-faint)]">
          &copy; {new Date().getFullYear()} bubb. Built for curious minds.
        </p>
      </div>
    </footer>
  );
}
