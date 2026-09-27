import { NavLink } from 'react-router-dom';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const steps = [
  {
    number: '1',
    title: 'Upload',
    description: 'Drop a 30–90 second video of any physical task. MP4, MOV, or WebM formats supported.',
  },
  {
    number: '2',
    title: 'Analyze',
    description: 'We identify the main steps, how long each takes, and the actions visible in the clip.',
  },
  {
    number: '3',
    title: 'Review',
    description: 'Review the steps, correct names, add notes, and jump to moments in the video.',
  },
  {
    number: '4',
    title: 'Export',
    description: 'Download a copy of the results to share or use in your own reports.',
  },
];

export function HowItWorks() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="landing-section landing-section-alt"
      aria-labelledby="how-it-works-title"
    >
      <div className="container">
        <div
          className={`section-header ${isVisible ? 'visible' : ''} scroll-reveal`}
        >
          <span className="section-label">How It Works</span>
          <h2 id="how-it-works-title" className="section-title">
            From clip to insight in four steps
          </h2>
          <p className="section-subtitle">
            Add a video, review the findings, and save a report for your team.
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <article
              key={step.number}
              className={`step-card ${isVisible ? 'visible' : ''} scroll-reveal stagger-${index + 1}`}
            >
              <span className="step-number" aria-label={`Step ${step.number}`}>
                {step.number}
              </span>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-desc">{step.description}</p>
            </article>
          ))}
        </div>

        <div
          className={`mt-16 text-center ${isVisible ? 'visible' : ''} scroll-reveal stagger-5`}
        >
          <NavLink
            to="/app"
            className="btn-primary inline-flex"
          >
            Open Application
          </NavLink>
        </div>
      </div>
    </section>
  );
}
