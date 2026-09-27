import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const problems = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    title: 'Manual analysis is slow and inconsistent',
    description: 'Industrial engineers spend weeks on time studies. Results vary by observer. Bottlenecks are missed. ROI calculations are guesswork.',
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Robot training data requires manual annotation',
    description: 'Building imitation learning datasets means frame-by-frame labeling. Thousands of hours per task. Error-prone. Does not scale across facilities.',
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
    title: 'No shared context between human and robot teams',
    description: 'Process engineers and robotics teams speak different languages. No common data format. Changes in one workflow do not propagate to the other.',
  },
];

const solutionPoints = [
  'Automatic process detection from 30–90s video',
  'Human insights: steps, timing, bottlenecks, ROI',
  'Robot data: atomic actions with embodiment-ready parameters (approach angle, grip type, object dimensions, force/pressure cues)',
  'Object & scene graph: spatial relationships and 3D pose estimates across the task',
  'Success/Failure & variation signal across multiple demonstrations',
  'Single source of truth for both teams',
  'Local processing — video never leaves your browser',
  'Standards-based outputs: JSON Schema, CSV, ROS 2',
];

export function ProblemSolution() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="problem-solution"
      className="landing-section"
      aria-labelledby="problem-solution-title"
    >
      <div className="container">
        <div
          className={`section-header ${isVisible ? 'visible' : ''} scroll-reveal`}
        >
          <span className="section-label">The Problem</span>
          <h2 id="problem-solution-title" className="section-title">
            Physical work is invisible to automation
          </h2>
          <p className="section-subtitle">
            Your experts know the process. Your robots don't. PhysioSkill bridges the gap.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid lg:grid-cols-3 gap-6 mb-20 lg:mb-24">
          {problems.map((problem, index) => (
            <Card
              key={problem.title}
              className={`${isVisible ? 'visible' : ''} scroll-reveal stagger-${index + 1} border-[#e5e5ea] hover:border-[#d2d2d7] transition-colors`}
            >
              <CardHeader>
                <div className="pillar-icon" aria-hidden="true">
                  {problem.icon}
                </div>
                <CardTitle className="pillar-title">{problem.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="pillar-desc">{problem.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="divider" />

        {/* Solution vs Without Comparison */}
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 ${isVisible ? 'visible' : ''} scroll-reveal stagger-4`}>
          {/* Without PhysioSkill */}
          <Card className="border-[#e5e5ea] bg-white">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <CardTitle className="text-[18px] font-semibold text-[#1d1d1f]">Without PhysioSkill</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {problems.map((problem, i) => (
                  <li key={problem.title} className="flex items-start gap-4">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                      <span className="text-[12px] font-semibold text-red-600">{i + 1}</span>
                    </span>
                    <div>
                      <p className="text-[14px] font-medium text-[#1d1d1f]">{problem.title}</p>
                      <p className="mt-1 text-[13px] text-[#6e6e73]">{problem.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* With PhysioSkill */}
          <Card className="border-[#0f172a] bg-[#0f172a] text-white">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <CardTitle className="text-[18px] font-semibold text-white">With PhysioSkill</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {solutionPoints.map((point) => (
                  <li key={point} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#30D158" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <p className="text-[14px] text-white/90 leading-relaxed">{point}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
