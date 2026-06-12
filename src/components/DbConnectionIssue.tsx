import React from 'react';

export const DbConnectionIssue = () => (
  <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-stone-50/90 backdrop-blur-sm p-4">
    <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-xl max-w-md w-full text-center">
      <div className="text-red-500 mb-4 flex justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      </div>
      <h2 className="text-2xl font-black text-stone-900 mb-2">Technical Connection Issue</h2>
      <p className="text-stone-600 mb-6 font-medium leading-relaxed">
        We're having trouble reaching our secure database right now. Our technical team has been notified automatically. Please try again in a moment.
      </p>
      <button 
        onClick={() => window.location.reload()}
        className="w-full bg-stone-900 text-white rounded-2xl py-4 font-bold hover:bg-stone-800 transition-all active:scale-[0.98]"
      >
        Retry Access
      </button>
    </div>
  </div>
);
