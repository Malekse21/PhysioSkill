import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const pillars = [
  {
    id: 'human-insights',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    title: 'Human Insights',
    description: 'Understand your process at a glance. Identify waste, measure cycle time, and quantify improvement opportunities.',
    items: [
      'Process timeline with step-by-step breakdown',
      'Step timing and duration analysis',
      'Bottleneck detection with severity ranking',
      'Lean improvement suggestions with ROI estimates',
      'A single "cost of this process" number — not just a time breakdown',
      'A ranked "fix this first" recommendation',
      'Comparison baseline over time: is the process getting better or worse?',
    ],
  },
  {
    id: 'robot-data',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="2" />
        <path d="M12 6v12M6 12h12" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
    title: 'Robot Training Data',
    description: 'Convert human demonstrations into structured robot data. Ready for imitation learning and simulation.',
    items: [
      'Atomic manipulation primitives (pick, place, move, hold, align, inspect) with embodiment-ready parameters',
      'Object & scene graph: spatial relationships and 3D pose estimates',
      'Success/failure and variation signal across multiple demonstrations',
      'Export: JSON Schema, CSV, ROS 2 compatible formats',
      'Schema-validated for pipeline integration',
      'Approach angle, grip type (parallel/suction/multi-finger), object dimensions',
      'Force/pressure cues inferred from object deformation',
    ],
  },
];

export function Pillars() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="features"
      className="landing-section"
      aria-labelledby="features-title"
    >
      <div className="container">
        <div
          className={`section-header ${isVisible ? 'visible' : ''} scroll-reveal`}
        >
          <span className="section-label">Features</span>
          <h2 id="features-title" className="section-title">
            Two outputs. One upload.
          </h2>
          <p className="section-subtitle">
            Every analysis shows the process steps and the actions seen in the video.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {pillars.map((pillar, index) => (
            <Card
              key={pillar.id}
              className={`${isVisible ? 'visible' : ''} scroll-reveal stagger-${index + 1} border-[#e5e5ea] hover:border-[#d2d2d7] hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300`}
            >
              <CardHeader>
                <div className="pillar-icon" aria-hidden="true">
                  {pillar.icon}
                </div>
                <CardTitle className="pillar-title">{pillar.title}</CardTitle>
                <p className="pillar-desc">{pillar.description}</p>
              </CardHeader>
              <CardContent>
                <ul className="pillar-list" aria-label={`${pillar.title} capabilities`}>
                  {pillar.items.map((item, i) => (
                    <li key={i} className="pillar-item">
                      <span className="pillar-bullet" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}