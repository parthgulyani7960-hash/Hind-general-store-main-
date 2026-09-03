import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { useStore } from '@/StoreContext';

export default function AuthDiagnosticOverlay() {
  const { authInitDuration } = useStore();
  
  if (authInitDuration === null || authInitDuration <= 3000) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-amber-50 border border-amber-200 p-4 rounded-xl shadow-lg max-w-sm flex items-start gap-3">
      <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={20} />
      <div>
        <h4 className="text-sm font-bold text-amber-900">Slow Auth Initialization</h4>
        <p className="text-xs text-amber-700 mt-1">
          Authentication took {authInitDuration}ms to initialize, which is longer than expected (3000ms).
        </p>
      </div>
    </div>
  );
}
