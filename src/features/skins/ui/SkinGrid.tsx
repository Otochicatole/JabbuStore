"use client";

import { useSkins } from './useSkins';
import { SkinCard } from './SkinCard';

export const SkinGrid = () => {
  const { skins, loading } = useSkins();

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass h-[300px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {skins.map((skin) => (
        <SkinCard key={skin.id} skin={skin} />
      ))}
    </div>
  );
};
