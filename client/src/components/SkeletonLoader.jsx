import React from 'react';

// Single video card skeleton
export const VideoCardSkeleton = () => {
  return (
    <div className="rounded-lg overflow-hidden border border-white/5 bg-neutral-950 animate-pulse">
      <div className="aspect-video w-full bg-neutral-900"></div>
      <div className="p-5 space-y-3">
        <div className="h-4 bg-neutral-900 rounded w-3/4"></div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 bg-neutral-900 rounded w-1/4"></div>
          <div className="h-3 bg-neutral-900 rounded w-1/6"></div>
        </div>
      </div>
    </div>
  );
};

// Grid list skeleton
export const VideoGridSkeleton = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <VideoCardSkeleton key={i} />
      ))}
    </div>
  );
};

// Filter tabs skeleton
export const CategoryTabsSkeleton = () => {
  return (
    <div className="flex flex-wrap gap-3 animate-pulse mb-8 justify-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-9 w-24 bg-neutral-900 rounded-full"></div>
      ))}
    </div>
  );
};

// Stats dashboard skeleton
export const StatsDashboardSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-neutral-950 border border-white/5 rounded-xl p-6 space-y-3">
          <div className="h-3 bg-neutral-900 rounded w-1/3"></div>
          <div className="h-6 bg-neutral-900 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
};

// Detailed page loader
export const VideoPlayerPageSkeleton = () => {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-16 px-6 md:px-12 animate-pulse">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Large player */}
        <div className="aspect-video w-full bg-neutral-950 rounded-xl border border-white/5"></div>
        
        {/* Title details */}
        <div className="space-y-4">
          <div className="h-8 bg-neutral-950 rounded w-1/2"></div>
          <div className="flex space-x-4">
            <div className="h-4 bg-neutral-950 rounded w-16"></div>
            <div className="h-4 bg-neutral-950 rounded w-20"></div>
          </div>
          <hr className="border-white/5 my-6" />
          <div className="space-y-2">
            <div className="h-4 bg-neutral-950 rounded w-full"></div>
            <div className="h-4 bg-neutral-950 rounded w-5/6"></div>
            <div className="h-4 bg-neutral-950 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
