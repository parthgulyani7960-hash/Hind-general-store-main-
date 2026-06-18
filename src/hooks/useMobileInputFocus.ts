import { useEffect } from 'react';

/**
 * Hook to optimize mobile input experience.
 * Ensures focused inputs are visible and apply a focus transition effect.
 */
export function useMobileInputFocus(active: boolean = true) {
  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        const isMobile = /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent) || window.innerWidth < 768;
        
        if (isMobile) {
          // Small delay to allow the keyboard to start appearing
          setTimeout(() => {
            target.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            
            // Add a visual indicator/transition class
            target.classList.add('mobile-focused');
          }, 300);
        }
      }
    };

    const handleBlur = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        target.classList.remove('mobile-focused');
      }
    };

    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [active]);
}
