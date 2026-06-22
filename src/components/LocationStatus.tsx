import React from 'react';
import { Navigation, MapPin, AlertCircle, RotateCw, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LocationStatusProps {
  status: 'idle' | 'fetching' | 'success' | 'error';
  accuracy?: number | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  className?: string;
  coords?: { lat: number; lng: number } | null;
  backoffDelay?: number | null;
  attempt?: number | null;
  maxAttempts?: number | null;
  postcode?: string | null;
}

export const LocationStatus: React.FC<LocationStatusProps> = ({
  status,
  accuracy,
  errorMessage,
  onRetry,
  className,
  coords,
  backoffDelay,
  attempt,
  maxAttempts = 3,
  postcode,
}) => {
  return (
    <div id="location-status-badge-container" className={cn("w-full transition-all duration-300", className)}>
      {status === 'fetching' && (
        <div id="location-status-badge-fetching" className="bg-amber-50/40 border border-amber-200/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
            <RotateCw className="w-5 h-5 animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-stone-800 uppercase tracking-wider">Establishing GPS Sync...</p>
            {attempt ? (
              <p className="text-[10px] text-stone-500 font-extrabold uppercase tracking-widest">
                Search Attempt {attempt} of {maxAttempts}
              </p>
            ) : (
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                Scanning coordinates
              </p>
            )}
            {backoffDelay !== undefined && backoffDelay !== null && backoffDelay > 0 && (
              <p className="text-red-500 text-[9px] font-black uppercase tracking-widest animate-pulse mt-1">
                Optimizing signal: retrying in {backoffDelay.toFixed(0)}s
              </p>
            )}
          </div>
        </div>
      )}

      {status === 'success' && (
        <div id="location-status-badge-success" className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <MapPin className="w-5 h-5 animate-bounce text-emerald-600" />
          </div>
          <div className="space-y-1 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <p className="text-xs font-black text-stone-800 uppercase tracking-wider">Position Locked</p>
              {accuracy !== undefined && accuracy !== null && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                  accuracy <= 25 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  Current location detected
                </span>
              )}
              {postcode && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border bg-primary/10 text-primary border-primary/20">
                  PIN: {postcode}
                </span>
              )}
            </div>
            {coords && (
              <p className="text-[10px] font-mono font-semibold text-stone-500 bg-stone-100/50 px-2 py-1 rounded inline-block">
                GPS: {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </p>
            )}
            <p className="text-[10px] text-emerald-700/80 font-black uppercase tracking-widest leading-relaxed">
              GPS Lock active and verified for doorway dispatch.
            </p>
          </div>
        </div>
      )}

      {status === 'error' && (
        <button
          id="location-status-badge-retry-btn"
          type="button"
          onClick={onRetry}
          className="w-full bg-red-50/70 hover:bg-red-50 border border-red-100 rounded-2xl p-4 flex flex-col text-center items-center justify-center space-y-3 transition-all group focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-red-800 uppercase tracking-wider group-hover:underline">
              Failed - Click to Retry
            </p>
            {errorMessage && (
              <p className="text-[10px] text-red-600 font-bold max-w-sm leading-relaxed px-2">
                {errorMessage}
              </p>
            )}
          </div>
        </button>
      )}

      {status === 'idle' && (
        <div id="location-status-badge-idle" className="bg-stone-50 border border-stone-150 rounded-2xl p-4 flex items-center space-x-3 text-left">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
            <Compass className="w-4 h-4 text-stone-400" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[11px] font-black text-stone-700 uppercase tracking-wider">Awaiting GPS Verify</p>
            <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest leading-none">
              Coordinates not yet loaded
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
