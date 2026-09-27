import { useEffect, useState } from 'react';

export function useScrollSpy(sectionIds: string[], offset = 100) {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || '');

  useEffect(() => {
    const observers = sectionIds.map((id) => {
      const element = document.getElementById(id);
      if (!element) return null;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        {
          rootMargin: `-${offset}px 0px -${window.innerHeight - offset - 100}px 0px`,
          threshold: 0,
        }
      );

      observer.observe(element);
      return observer;
    });

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [sectionIds, offset]);

  return activeSection;
}