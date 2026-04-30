"use client";

import React from 'react';
import { MOCK_INVENTORY } from '../infrastructure/mock-inventory';
import { InventoryCard } from './InventoryCard';

interface InventoryGridProps {
  variant?: 'simple' | 'sell';
}

export const InventoryGrid = ({ variant = 'sell' }: InventoryGridProps) => {
  const gridCols = variant === 'sell' 
    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3" 
    : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <div className={`grid gap-6 ${gridCols}`}>
      {MOCK_INVENTORY.map((skin) => (
        <InventoryCard key={skin.id} skin={skin} variant={variant} />
      ))}
    </div>
  );
};
