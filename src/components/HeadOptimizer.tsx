import React, { useEffect } from 'react';

export default function HeadOptimizer(): null {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const dynamicLinks: HTMLLinkElement[] = [];

    const createLink = (rel: string, href: string, attributes: Record<string, string> = {}) => {
      // Check if already exists to prevent duplicate insertion
      const existing = document.querySelector(`link[href="${href}"][rel="${rel}"]`);
      if (existing) return;

      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      Object.entries(attributes).forEach(([key, val]) => {
        link.setAttribute(key, val);
      });
      document.head.appendChild(link);
      dynamicLinks.push(link);
    };

    // 1. Dynamic Preconnect headers for font services
    createLink('preconnect', 'https://fonts.googleapis.com');
    createLink('preconnect', 'https://fonts.gstatic.com', { crossorigin: 'anonymous' });

    // 2. Preload important Google Fonts stylesheet
    createLink('preload', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap', {
      as: 'style'
    });
    // Immediately load it
    createLink('stylesheet', 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');

    // 3. Preload Critical Hero and Banner images to boost Time To Visually Complete / Time-To-First-Paint
    const criticalHeroImages = [
      'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800'
    ];

    criticalHeroImages.forEach((imgUrl) => {
      createLink('preload', imgUrl, {
        as: 'image',
        type: 'image/jpeg',
        referrerpolicy: 'no-referrer'
      });
    });

    console.log('[OPTIMIZER] Dynamic preconnect and preload tags injected successfully.');

    return () => {
      // Cleanup dynamically injected elements if the optimizer unmounts
      dynamicLinks.forEach((link) => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
        } catch (e) {
          // ignore
        }
      });
    };
  }, []);

  return null;
}
