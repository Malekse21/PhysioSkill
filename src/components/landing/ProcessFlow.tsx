import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const flowSteps = [
  {
    number: '1',
    label: 'Capture',
    description: 'Record a 30–90 second video of any physical task using a phone or tablet. No special equipment needed.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    details: [
      'MP4, MOV, WebM up to 100MB',
      'Automatic frame sampling at 2 FPS',
      'Works with any handheld device',
    ],
  },
  {
    number: '2',
    label: 'Analyze',
    description: 'Computer vision and process intelligence extract structured data: steps, timing, bottlenecks, and atomic robot actions.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
    details: [
      'Process map with step timing',
      'Bottleneck detection with severity',
      'Atomic primitives: pick, place, move, hold, align, inspect',
      'Normalized bounding boxes (0-1000)',
    ],
  },
  {
    number: '3',
    label: 'Deploy',
    description: 'Export standardized data for human review, robot training pipelines, simulation environments, or version control.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
    details: [
      'JSON Schema validated outputs',
      'CSV for spreadsheet analysis',
      'ROS 2 compatible for robotics',
      'Version snapshots with diff tracking',
    ],
  },
];

export function ProcessFlow() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="process-flow"
      className="landing-section landing-section-alt"
      aria-labelledby="process-flow-title"
    >
      <div className="container">
        <div
          className={`section-header ${isVisible ? 'visible' : ''} scroll-reveal`}
        >
          <span className="section-label">How It Works</span>
          <h2 id="process-flow-title" className="section-title">
            From video to deployment in three steps
          </h2>
          <p className="section-subtitle">
            No configuration. No manual annotation. Structured results in seconds.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line */}
          <div
            className={`absolute top-20 left-1/2 -translate-x-1/2 w-0.5 h-[calc(100%-5rem)] bg-gradient-to-b from-[#e5e5ea] to-transparent hidden lg:block ${isVisible ? 'visible' : ''} scroll-reveal stagger-4`}
            aria-hidden="true"
          />

          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 relative">
            {flowSteps.map((step, index) => (
              <Card
                key={step.label}
                className={`relative ${isVisible ? 'visible' : ''} scroll-reveal stagger-${index + 1} border-[#e5e5ea] hover:border-[#d2d2d7] transition-colors`}
              >
                {/* Step number circle */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 z-10">
                  <div className="w-10 h-10 rounded-full bg-[#0f172a] text-white flex items-center justify-center font-semibold text-[16px] border-4 border-white shadow-lg">
                    {step.number}
                  </div>
                </div>

                <CardHeader className="pt-14 text-center">
                  {/* Icon */}
                  <div className="w-14 h-14 rounded-xl bg-[#f5f5f7] flex items-center justify-center mx-auto mb-5 text-[#0f172a]" aria-hidden="true">
                    {step.icon}
                  </div>

                  {/* Label */}
                  <CardTitle className="text-[18px] font-semibold text-[#1d1d1f] mb-2">{step.label}</CardTitle>
                  <p className="text-[14px] text-[#6e6e73] leading-relaxed mb-6 max-w-xs mx-auto">{step.description}</p>
                </CardHeader>

                <CardContent>
                  {/* Details */}
                  <ul className="space-y-2 text-left max-w-xs mx-auto text-[13px]">
                    {step.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#45454a] leading-relaxed">
                        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#0f172a] mt-2" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 lg:mt-20 text-center">
          <Button
            size="lg"
            className={`bg-[#0f172a] hover:bg-[#1e293b] ${isVisible ? 'visible' : ''} scroll-reveal stagger-5`}
            onClick={() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' })}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Get Your First Process Report
          </Button>
        </div>
      </div>
    </section>
  );
}