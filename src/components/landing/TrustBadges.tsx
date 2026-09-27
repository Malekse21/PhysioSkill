import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const trustBadges = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <path d="M12 6v12M6 12h12" />
      </svg>
    ),
    label: 'Privacy by Design',
    description: 'Video never leaves your browser unless you choose cloud analysis',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: 'Local Processing',
    description: 'Frame sampling and analysis run entirely client-side',
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
    label: 'JSON Schema Validated',
    description: 'All outputs conform to strict schemas for pipeline integration',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    label: 'ROS 2 Compatible',
    description: 'Atomic actions map directly to robotics middleware standards',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    label: 'No Vendor Lock-in',
    description: 'Export JSON, CSV, ROS 2 — own your data and workflows',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <path d="M12 6v12M6 12h12" />
      </svg>
    ),
    label: 'Audit Ready',
    description: 'Version snapshots with diff tracking for compliance reviews',
  },
];

export function TrustBadges() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="trust-badges"
      className="landing-section landing-section-alt border-t border-[#e5e5ea] border-b border-[#e5e5ea] py-12 lg:py-16"
      aria-labelledby="trust-badges-title"
    >
      <div className="container">
        <h2 id="trust-badges-title" className="sr-only">Security & Compliance</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {trustBadges.map((badge, index) => (
            <article
              key={badge.label}
              className={`trust-card ${isVisible ? 'visible' : ''} scroll-reveal stagger-${index + 1}`}
            >
              <div className="trust-icon" aria-hidden="true">
                {badge.icon}
              </div>
              <h3 className="trust-title">{badge.label}</h3>
              <p className="trust-desc">{badge.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}