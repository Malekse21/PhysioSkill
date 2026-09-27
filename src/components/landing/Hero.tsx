import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { HeroIllustration } from './HeroIllustration';
import { Logo } from './Logo';

export function Hero() {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <section
      ref={ref}
      id="hero"
      className="relative min-h-screen flex items-center justify-center pt-16 lg:pt-0 overflow-hidden"
      aria-labelledby="hero-title"
    >
      <div className="container px-6 lg:px-8 xl:px-12 py-20 lg:py-28 xl:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div
            className={`${isVisible ? 'visible' : ''} scroll-reveal`}
          >
            <div className="flex items-center gap-3 mb-6">
              <Logo size={72} />
              <span className="text-[22px] font-semibold tracking-tight text-[#1d1d1f]">PhysioSkill</span>
            </div>

            <h1
              id="hero-title"
              className="section-title text-[36px] lg:text-[48px] xl:text-[56px] max-w-4xl mx-auto lg:mx-0 text-left"
            >
              Turn handheld video into process intelligence
            </h1>
            <p className="section-subtitle text-[17px] lg:text-[20px] max-w-3xl mx-auto lg:mx-0 text-left mt-5">
              Upload a short clip. Get process maps, bottleneck reports, and robot-ready action data.
            </p>

            <div className="flex flex-col sm:flex-row items-center sm:items-center justify-center lg:justify-start gap-4 mt-10">
              <NavLink to="/app">
                <Button size="lg" className="w-full sm:w-auto bg-[#0f172a] hover:bg-[#1e293b]">
                  Open Application
                </Button>
              </NavLink>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto border-[#d2d2d7] hover:border-[#8a8a8f]"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>
          </div>

          <div
            className={`${isVisible ? 'visible' : ''} scroll-reveal stagger-1`}
            aria-hidden="true"
          >
            <HeroIllustration />
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" aria-hidden="true" />
    </section>
  );
}