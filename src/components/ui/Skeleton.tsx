import React from 'react';
import { cn } from '../../types';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-stone-200", className || "")}
      {...props}
    />
  );
}

export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-3xl p-4 border border-stone-100 shadow-sm space-y-4">
      <Skeleton className="aspect-square w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-8 w-1/3 rounded-xl" />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="pt-4 border-t border-stone-100 flex justify-between items-center">
        <Skeleton className="h-6 w-1/4" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-stone-50">
      {[...Array(columns)].map((_, i) => (
        <div key={i} className={cn("h-4 flex-1", i === 0 && "flex-[2]")}>
          <Skeleton className="w-full h-full" />
        </div>
      ))}
    </div>
  );
}
