export const triggerFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      const saved = localStorage.getItem('hgs_vibration');
      if (saved === 'false') {
        return;
      }
    } catch (err) {}
    const patterns = {
      light: [10],
      medium: [30],
      heavy: [50, 30, 50]
    };
    navigator.vibrate(patterns[type]);
  }
};
