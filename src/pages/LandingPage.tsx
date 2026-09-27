import { Navigation } from '../components/landing/Navigation';
import { Hero } from '../components/landing/Hero';
import { ProblemSolution } from '../components/landing/ProblemSolution';
import { Pillars } from '../components/landing/Pillars';
import { ProcessFlow } from '../components/landing/ProcessFlow';
import { Footer } from '../components/landing/Footer';

export function LandingPage() {
  return (
    <div className="landing-container">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Navigation />
      <main id="main-content" tabIndex={-1}>
        <Hero />
        <ProblemSolution />
        <Pillars />
        <ProcessFlow />
      </main>
      <Footer />
    </div>
  );
}