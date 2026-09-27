import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const signals = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <path d="M12 6v12M6 12h12" />
      </svg>
    ),
    title: 'Private by Default',
    description: 'Your video stays in your browser while we prepare it. Selected moments are sent securely for analysis.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: 'Ready to use',
    description: 'Get a clear step-by-step report, then download the results to share with your team.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: 'Clear results',
    description: 'See each step, how long it took, where work slowed down, and what could be improved.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'No Setup Required',
    description: 'Add a video and let the app prepare a report. No setup is needed to review your findings.',
  },
];

export function TrustSignals() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="trust"
      className="landing-section"
      aria-labelledby="trust-title"
    >
      <div className="container">
        <div
          className={`section-header ${isVisible ? 'visible' : ''} scroll-reveal`}
        >
          <span className="section-label">Why PhysioSkill</span>
          <h2 id="trust-title" className="section-title">
            Built for how engineering teams work
          </h2>
          <p className="section-subtitle">
            Privacy-first architecture, standards-based outputs, and zero friction to start.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {signals.map((signal, index) => (
            <article
              key={signal.title}
              className={`trust-card ${isVisible ? 'visible' : ''} scroll-reveal stagger-${index + 1}`}
            >
              <div className="trust-icon" aria-hidden="true">
                {signal.icon}
              </div>
              <h3 className="trust-title">{signal.title}</h3>
              <p className="trust-desc">{signal.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
