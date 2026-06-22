import React, { lazy } from 'react';
import { AlertTriangle } from 'lucide-react';

// Enhanced lazy loader with exponential backoff and better error recovery
export function lazyWithRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  name: string = 'Component'
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const MAX_RETRIES = 2;
    let attempt = 0;
    
    const executeLoad = async (): Promise<{ default: T }> => {
      try {
        return await componentImport();
      } catch (error: any) {
        attempt++;
        const errMessage = String(error?.message || error || '');
        const isChunkLoadError = error?.name === 'ChunkLoadError' || 
                                errMessage.includes('Chunk') ||
                                errMessage.includes('Loading chunk') ||
                                errMessage.includes('dynamically imported module') ||
                                errMessage.includes('Failed to fetch') ||
                                errMessage.includes('fetch');
        
        if (isChunkLoadError && attempt <= MAX_RETRIES) {
          const delay = attempt * 1000;
          console.warn(`[LAZY] Load failed for ${name}. Retry ${attempt}/${MAX_RETRIES} in ${delay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeLoad();
        }
        
        console.error(`[LAZY] Critical load failure for ${name}:`, error);
        
        // Return a graceful recovery component instead of throwing
        return {
          default: (() => (
            <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh] bg-stone-50/50 rounded-[2.5rem] border border-dashed border-stone-200 m-4">
              <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 text-amber-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-black text-stone-900 tracking-tight">Section Temporarily Unavailable</h3>
              <p className="text-sm text-stone-500 mt-3 max-w-sm leading-relaxed font-medium">
                We encountered a module loading sync issue while accessing <strong>{name}</strong>. This often happens after a system update.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-8 py-3 bg-stone-900 hover:bg-stone-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-lg active:scale-95"
                >
                  Refresh Application
                </button>
                <button 
                  onClick={() => window.location.href = '/'} 
                  className="px-8 py-3 bg-white border border-stone-200 text-stone-500 hover:text-stone-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-95"
                >
                  Return Home
                </button>
              </div>
            </div>
          )) as unknown as T
        };
      }
    };
    
    return executeLoad();
  });
}
