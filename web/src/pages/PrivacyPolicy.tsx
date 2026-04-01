export function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <a
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors mb-10"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to home
        </a>

        <h1 className="font-serif text-4xl md:text-5xl font-bold text-[var(--color-ink)] tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-sm text-[var(--color-ink-faint)] mb-12">
          Effective Date: March 31, 2026
        </p>

        <div className="space-y-10 text-[var(--color-ink-muted)] leading-relaxed">
          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">Overview</h2>
            <p>
              bubb is a Chrome Extension offering AI-powered explanations for highlighted text on webpages.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">Data Collection</h2>
            <p className="mb-3">The extension gathers:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Google account info (email, name, profile picture) for authentication purposes</li>
              <li>Highlighted text and surrounding webpage context, which are forwarded to AI providers for generating explanations</li>
              <li>Saved notes and topics stored in the backend database</li>
              <li>Authentication tokens maintained locally in your browser</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">Data Usage</h2>
            <p>
              Information is used to authenticate users, generate AI explanations, store notes, and synchronize data across sessions.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">Third-Party Partners</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase:</strong> Database and authentication hosting</li>
              <li><strong>OpenAI / Anthropic:</strong> Process text to generate explanations based on user preference</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">Data Practices</h2>
            <p>
              The extension does not sell data, use it for advertising, track browsing history, or monitor activity beyond explicitly highlighted text.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">Security & Storage</h2>
            <p>
              Data resides in Supabase with Row Level Security enabled — users can only access their own data. Authentication tokens stay local to your browser.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">User Controls</h2>
            <p>
              Users may delete notes and topics anytime. For complete account deletion, contact:{' '}
              <a href="mailto:dcabansay123@gmail.com" className="text-[var(--color-coral)] hover:underline">
                dcabansay123@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl font-semibold text-[var(--color-ink)] mb-3">Updates</h2>
            <p>
              This policy may be updated as the product develops. Significant changes will be communicated via the extension.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
