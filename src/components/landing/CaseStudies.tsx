import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { BENCHMARK_PRESETS } from '../../data/benchmarks';

const caseStudies = BENCHMARK_PRESETS.map((preset) => {
  const insights = preset.data.human_insights;
  const robot = preset.data.robot_data;
  const totalTimeSaved = insights.improvement_suggestions.reduce((acc, s) => acc + s.estimated_time_saved_sec, 0);
  const bottleneckCount = insights.bottlenecks.length;
  const stepCount = insights.steps.length;
  const actionCount = robot.atomic_actions.length;

  return {
    id: preset.id,
    title: preset.title,
    industry: preset.industry,
    description: preset.description,
    poster: preset.poster,
    metrics: [
      { label: 'Cycle Time', value: `${insights.total_duration_seconds}s` },
      { label: 'Efficiency', value: `${insights.efficiency_score}%` },
      { label: 'Time Saved', value: `${totalTimeSaved.toFixed(1)}s/cycle` },
      { label: 'Robot Actions', value: actionCount },
    ],
    highlights: [
      `${stepCount} process steps identified`,
      `${bottleneckCount} bottleneck${bottleneckCount !== 1 ? 's' : ''} detected`,
      `${actionCount} atomic actions extracted`,
      `${insights.improvement_suggestions.length} improvement suggestions`,
    ],
  };
});

export function CaseStudies() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="case-studies"
      className="landing-section"
      aria-labelledby="case-studies-title"
    >
      <div className="container">
        <div
          className={`section-header ${isVisible ? 'visible' : ''} scroll-reveal`}
        >
          <span className="section-label">Case Studies</span>
          <h2 id="case-studies-title" className="section-title">
            Tested on real industrial tasks
          </h2>
          <p className="section-subtitle">
            Four benchmark scenarios from electronics, logistics, automotive, and maintenance.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
          {caseStudies.map((study, index) => (
            <article
              key={study.id}
              className={`pillar-card relative overflow-hidden ${isVisible ? 'visible' : ''} scroll-reveal stagger-${index + 1}`}
            >
              {/* Image/Poster */}
              <div className="relative aspect-video mb-6 rounded-xl overflow-hidden bg-[#f5f5f7]">
                <img
                  src={study.poster}
                  alt={study.title}
                  className="w-full h-full object-cover opacity-90"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                  <span className="text-[11px] font-medium px-2 py-1 bg-white/10 backdrop-blur rounded tracking-wide uppercase">{study.industry}</span>
                  <span className="text-[12px] font-mono tabular-nums">{study.metrics[0].value}</span>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-5">
                <div>
                  <h3 className="text-[18px] font-semibold text-[#1d1d1f]">{study.title}</h3>
                  <p className="mt-1 text-[14px] text-[#6e6e73] leading-relaxed">{study.description}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#e5e5ea]">
                  {study.metrics.map((metric) => (
                    <div key={metric.label} className="text-center p-3 rounded-xl bg-[#fafafa] border border-[#e5e5ea]">
                      <p className="text-[22px] font-semibold text-[#1d1d1f] tabular-nums">{metric.value}</p>
                      <p className="text-[11px] text-[#8a8a8f] font-medium uppercase tracking-wide mt-0.5">{metric.label}</p>
                    </div>
                  ))}
                </div>

                {/* Highlights */}
                <ul className="space-y-2 pt-2 border-t border-[#e5e5ea]">
                  {study.highlights.map((highlight, i) => (
                    <li key={i} className="flex items-start gap-2 text-[13px] text-[#45454a] leading-relaxed">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#0f172a] mt-2" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 lg:mt-20 text-center">
          <div
            className={`inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#0f172a] text-white ${isVisible ? 'visible' : ''} scroll-reveal stagger-5`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="text-[15px] font-medium">Try These Benchmarks</span>
          </div>
        </div>
      </div>
    </section>
  );
}