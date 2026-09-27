import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasAnimated(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
        ...options,
      }
    );

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => observer.disconnect();
  }, [hasAnimated, options]);

  return { ref: elementRef, isVisible: isVisible || hasAnimated };
}