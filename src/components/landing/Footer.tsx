import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Logo } from './Logo';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const footerLinks: Record<string, FooterLink[]> = {
  Product: [
    { label: 'Features', href: '#features', external: false },
    { label: 'Pricing', href: '/pricing', external: false },
    { label: 'Changelog', href: '/changelog', external: false },
    { label: 'Roadmap', href: '/roadmap', external: false },
  ],
  Company: [
    { label: 'About', href: '/about', external: false },
    { label: 'Blog', href: '/blog', external: false },
    { label: 'Careers', href: '/careers', external: false },
    { label: 'Contact', href: '/contact', external: false },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs', external: false },
    { label: 'Community', href: '/community', external: false },
    { label: 'API Reference', href: '/api', external: false },
    { label: 'GitHub', href: 'https://github.com', external: true },
  ],
};

const socialLinks = [
  { label: 'GitHub', href: 'https://github.com', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
    </svg>
  ) },
  { label: 'Twitter', href: 'https://twitter.com', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 9.355H15.247l-7.198-8.383L3.05 21.75H0l10.022-11.26L.324 2.25h3.515l7.183 8.215-2.258 2.53 5.715-6.455L24 21.75h-3.392l-6.953-7.92 7.875-9.33-4.278.24z"/>
    </svg>
  ) },
  { label: 'LinkedIn', href: 'https://linkedin.com', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ) },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <footer className="bg-[#f5f5f7] border-t border-[#e5e5ea]" role="contentinfo">
      <div className="container px-6 lg:px-8 xl:px-12 py-16 lg:py-20">
        {/* Newsletter Signup */}
        <Card className="mb-16 lg:mb-20 bg-[#0f172a] border-none">
          <CardContent className="p-8 lg:p-12">
            <div className="max-w-2xl mx-auto text-center">
              <CardTitle className="text-[22px] lg:text-[28px] font-semibold tracking-tight mb-3 text-white">
                Stay updated on PhysioSkill
              </CardTitle>
              <p className="text-white/70 text-[15px] leading-relaxed mb-6">
                Product updates, case studies, and engineering insights. No spam, unsubscribe anytime.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  disabled={submitted}
                  className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-white/50 focus:ring-2 focus:ring-white/20 transition-colors"
                  aria-label="Email address"
                />
                <Button
                  type="submit"
                  disabled={submitted || !email || !email.includes('@')}
                  className="px-6 py-3.5 rounded-xl bg-white text-[#0f172a] font-medium text-[14px] hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                >
                  {submitted ? (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      Subscribed!
                    </>
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </form>
              <p className="mt-3 text-[11px] text-white/50">
                  By subscribing, you agree to our terms of use.
                </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12 lg:mb-16">
          <div className="lg:col-span-2">
            <NavLink
              to="/"
              className="flex items-center gap-3 text-[18px] font-semibold tracking-tight text-[#1d1d1f] mb-4"
              aria-label="PhysioSkill Home"
            >
              <Logo size={56} />
              <span>PhysioSkill</span>
            </NavLink>
            <p className="text-[14px] text-[#6e6e73] leading-relaxed max-w-xs">
                Turn handheld video into process intelligence. Human insights and robot training data from a single upload. Identify bottlenecks, reduce costs, and train robots faster.
              </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <nav key={category} aria-label={`${category} links`}>
              <h4 className="footer-title">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="footer-link"
                      target={link.external ? '_blank' : undefined}
                      rel={link.external ? 'noopener noreferrer' : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="divider" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <p className="text-[12px] text-[#8a8a8f]">
            © {new Date().getFullYear()} PhysioSkill. Built for engineers.
          </p>

          <div className="flex items-center gap-6">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="text-[#8a8a8f] hover:text-[#1d1d1f] transition-colors duration-150"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}