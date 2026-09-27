import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '../ui/button';
import { useScrollSpy } from '../../hooks/useScrollSpy';
import { LogoMark } from './Logo';

const sections = ['features', 'problem-solution'];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const activeSection = useScrollSpy(sections);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 backdrop-blur-xl border-b border-[#e5e5ea] shadow-[0_1px_0_rgba(0,0,0,0.02)]'
          : 'bg-transparent'
      }`}
    >
      <nav className="mx-auto max-w-[1280px] px-6 lg:px-8 xl:px-12" aria-label="Main navigation">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <NavLink
            to="/"
            className="flex items-center gap-3 text-[18px] font-semibold tracking-tight text-[#1d1d1f] hover:opacity-80 transition-opacity"
            aria-label="PhysioSkill Home"
          >
            <LogoMark size={44} className="text-black" />
            <span className="hidden sm:block">PhysioSkill</span>
          </NavLink>

          <div className="hidden lg:flex items-center gap-6">
            {sections.map((section) => (
              <button
                key={section}
                onClick={() => scrollTo(section)}
                className={`text-[13px] font-medium transition-colors duration-150 relative ${
                  activeSection === section
                    ? 'text-[#1d1d1f]'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                {section === 'features' && 'Features'}
                {section === 'problem-solution' && 'Problem & Solution'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <NavLink
              to="/app"
              className="hidden sm:inline-flex"
            >
              <Button size="default" className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-6 py-2.5 rounded-xl text-[14px] font-medium transition-colors">
                Open Application
              </Button>
            </NavLink>
            <button
              className="lg:hidden p-2 rounded-lg text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-[#f5f5f7] transition-colors"
              aria-label="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
