import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get the key
      const key = e.key;
      const keyLower = key.toLowerCase();
      
      // Escape shortcut triggers a global custom event to close all dialogs/modals
      if (key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-all-modals'));
        return;
      }

      // If user is typing in an input field, textarea, select or contenteditable, ignore navigation shortcuts
      const activeElement = document.activeElement as HTMLElement | null;
      if (activeElement) {
        const tagName = activeElement.tagName.toLowerCase();
        const isContentEditable = activeElement.hasAttribute('contenteditable') && 
                                  activeElement.getAttribute('contenteditable') !== 'false';
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable) {
          return;
        }
      }

      // Handle navigation shortcuts (Case-insensitive)
      if (keyLower === 'g') {
        e.preventDefault();
        toast.success('Quick Nav: Home Page', { id: 'kb-nav', icon: '🏠' });
        navigate('/');
      } else if (keyLower === 'c') {
        e.preventDefault();
        toast.success('Quick Nav: Cart', { id: 'kb-nav', icon: '🛒' });
        navigate('/cart');
      } else if (keyLower === 'p') {
        e.preventDefault();
        toast.success('Quick Nav: Profile', { id: 'kb-nav', icon: '👤' });
        navigate('/profile');
      } else if (key === '?' || (isShiftKey(e) && key === '/')) {
        e.preventDefault();
        setShowHelp(prev => !prev);
      }
    };

    const isShiftKey = (event: KeyboardEvent) => event.shiftKey;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

  return { showHelp, setShowHelp };
};
