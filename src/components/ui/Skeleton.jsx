import React from "react";

export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] ${className}`}
      {...props}
    />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex gap-3 text-sm leading-relaxed p-2">
      <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2 max-w-[75%]">
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-12 h-3 rounded" />
        </div>
        <Skeleton className="w-full h-16 rounded-xl" />
      </div>
    </div>
  );
}

export default Skeleton;
