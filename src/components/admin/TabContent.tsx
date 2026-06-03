import React from 'react';
import { Suspense } from 'react';
import LoadingFallback from '@/components/LoadingFallback';

// We need to import all the tabs that TabContent uses, but AdminDashboard already has them.
// Since TabContent is used inside AdminDashboard, we can just pass them as props,
// or import them directly here if they are already imported there.
// To keep it simple, let's just make it a functional component that gets these as props.

export const TabContent = ({
  activeTab,
  ...props
}: any) => {
  return (
    <Suspense fallback={<LoadingFallback message="Loading tab..." />}>
      {(() => {
        switch (activeTab) {
          // Add the cases here from AdminDashboard.tsx
          default:
            return <div className="p-8 text-stone-500">Feature {activeTab} not yet fully redesigned.</div>;
        }
      })()}
    </Suspense>
  );
};
