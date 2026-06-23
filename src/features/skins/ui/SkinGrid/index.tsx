"use client";

import { useMemo, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Skin, SkinPagination } from '../../domain/skin';
import { SkinCard } from '../SkinCard';
import { useFilters } from '@/features/filters/context/FilterContext';
import { useI18n } from '@/shared/i18n/I18nProvider';

interface SkinGridProps {
  skins: Skin[];
  pagination: SkinPagination;
  loading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function getPageNumbers(currentPage: number, totalPages: number) {
  const pages: (number | string)[] = [];
  
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Always include page 1
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    // Determine the range of middle pages
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    // Adjust if at the boundaries
    let adjustedStart = start;
    let adjustedEnd = end;
    if (currentPage <= 3) {
      adjustedEnd = 4;
    } else if (currentPage >= totalPages - 2) {
      adjustedStart = totalPages - 3;
    }

    for (let i = adjustedStart; i <= adjustedEnd; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    // Always include last page
    pages.push(totalPages);
  }

  return pages;
}

export const SkinGrid = ({ skins, pagination, loading, error, onRetry }: SkinGridProps) => {
  const { t } = useI18n();
  const filters = useFilters();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const gridRef = useRef<HTMLDivElement>(null);
  const lastFilterSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    const signature = JSON.stringify({
      searchQuery: filters.searchQuery,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      selectedCategories: filters.selectedCategories,
      selectedConditions: filters.selectedConditions,
      sortOption: filters.sortOption,
      immediateTradeOnly: filters.immediateTradeOnly,
      groupSameItems: filters.groupSameItems,
    });

    if (lastFilterSignatureRef.current === null) {
      lastFilterSignatureRef.current = signature;
      return;
    }

    if (lastFilterSignatureRef.current === signature) return;
    lastFilterSignatureRef.current = signature;

    const currentPageParam = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;
    if (currentPageParam <= 1 || !pathname) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("page");
    router.replace(nextParams.toString() ? `${pathname}?${nextParams}` : pathname, {
      scroll: false,
    });
  }, [
    filters.groupSameItems,
    filters.immediateTradeOnly,
    filters.maxPrice,
    filters.minPrice,
    filters.searchQuery,
    filters.selectedCategories,
    filters.selectedConditions,
    filters.sortOption,
    pathname,
    router,
    searchParams,
  ]);

  const groupedSkins = useMemo(() => {
    return skins.map((skin) => skin.variants && skin.variants.length > 0 ? skin.variants : [skin]);
  }, [skins]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="group relative flex flex-col bg-card rounded-2xl p-4 border border-white/5 animate-pulse w-full">
            
            {/* 1. Item Name Skeleton at the very top */}
            <div className="mb-2.5">
              <div className="w-32 h-3.5 bg-white/5 rounded-full" />
            </div>

            {/* 2. Compact Info Panel Skeleton below the name */}
            <div className="flex flex-col gap-1.5 p-2 rounded-[8px] mb-3 bg-white/[0.01] border border-white/5">
              <div className="flex items-center justify-between">
                <div className="w-16 h-2.5 bg-white/5 rounded-full" />
                <div className="w-10 h-2.5 bg-white/5 rounded-full" />
              </div>
              <div className="h-0.5 w-full bg-white/5 rounded-full mt-0.5" />
            </div>

            {/* 3. Image Container Skeleton */}
            <div className="relative aspect-[4/3] w-full flex items-center justify-center my-2 bg-white/[0.01] rounded-xl border border-white/5">
              <div className="w-24 h-12 bg-white/5 rounded-lg" />
            </div>

            {/* 4. Rarity Divider Skeleton */}
            <div className="h-[2px] w-full mb-3 bg-white/5 rounded-full" />

            {/* 5. Price Section Skeleton */}
            <div className="flex flex-col mb-4">
              <div className="w-16 h-5 bg-white/5 rounded" />
            </div>

            {/* 6. Action Buttons Skeleton */}
            <div className="flex gap-2 h-10 mt-auto">
              <div className="flex-1 bg-white/5 rounded-lg" />
              <div className="w-10 bg-white/5 rounded-lg" />
            </div>
            
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-red-500/20 shadow-[0_0_50px_rgba(239,68,68,0.03)] relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/5 blur-[60px] rounded-full transition-opacity duration-500" />
        
        <div className="w-20 h-20 rounded-2xl bg-red-500/5 border border-red-500/20 flex items-center justify-center mb-6 relative z-10 shadow-inner">
          <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <p className="text-lg font-black text-white uppercase tracking-wider mb-2">{t("skinGrid.syncErrorTitle")}</p>
          <p className="text-xs text-[#84849b] leading-relaxed mb-8 text-center font-medium">
            {t("skinGrid.syncErrorDescription", { error })}
          </p>
          
          {onRetry && (
            <button 
              onClick={onRetry}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-accent hover:bg-accent/90 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 transition-all duration-300 active:scale-95 cursor-pointer border-none outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.89M9 11l3-3 3 3" />
              </svg>
              {t("skinGrid.retryConnection")}
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasActiveFilters = !!(filters.searchQuery || filters.minPrice || filters.maxPrice || filters.selectedCategories.length || filters.selectedConditions.length);

  if (skins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden group">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/5 blur-[50px] rounded-full" />

        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6 relative z-10">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        {hasActiveFilters ? (
          <>
            <p className="text-sm font-black text-white uppercase tracking-wider mb-2 relative z-10">{t("inventory.noResults")}</p>
            <p className="text-xs text-[#84849b] max-w-sm font-medium relative z-10">{t("skinGrid.noResultsDescription")}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-black text-white uppercase tracking-wider mb-2 relative z-10">{t("skinGrid.emptyMarket")}</p>
            <p className="text-xs text-[#84849b] max-w-sm font-medium relative z-10">{t("skinGrid.emptyMarketDescription")}</p>
          </>
        )}
      </div>
    );
  }

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const visibleGroups = groupedSkins;

  const handlePageChange = (page: number) => {
    if (!pathname || page === currentPage) return;

    const nextParams = new URLSearchParams(searchParams.toString());
    if (page <= 1) {
      nextParams.delete("page");
    } else {
      nextParams.set("page", String(page));
    }
    router.replace(nextParams.toString() ? `${pathname}?${nextParams}` : pathname, {
      scroll: false,
    });

    if (gridRef.current) {
      const yOffset = -120; // sticky header offset
      const element = gridRef.current;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const startIndex = pagination.total === 0 ? 0 : (currentPage - 1) * pagination.limit + 1;
  const endIndex = Math.min(currentPage * pagination.limit, pagination.total);

  const pageNumbers = getPageNumbers(currentPage, totalPages);

  return (
    <div ref={gridRef} className="flex flex-col gap-8 sm:gap-10 w-full overflow-hidden">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 w-full">
        {visibleGroups.map((group, index) => (
          <SkinCard
            key={group[0].id}
            skinsInGroup={group}
            priority={index < 5}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-6 mt-8 sm:mt-12 mb-6 min-w-0">
        {/* Contador de progreso ultra-estético */}
        <div className="text-center text-[10px] uppercase tracking-[0.2em] font-black text-[#84849b] bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-full flex flex-wrap items-center justify-center gap-2 shadow-inner">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          {t("skinGrid.showing")} <span className="text-white">{startIndex} - {endIndex}</span> {t("skinGrid.of")} <span className="text-white">{pagination.total}</span>
        </div>

        {totalPages > 1 && (
          <nav className="flex w-full max-w-full items-center gap-2 overflow-x-auto px-1 pb-2 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0" aria-label={t("skinGrid.pagination")}>
            {/* Botón Anterior */}
            <button
              onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/[0.02] text-[#84849b] transition-all duration-300 ${
                currentPage === 1
                  ? 'opacity-40 cursor-not-allowed text-white/20'
                  : 'hover:text-white hover:bg-white/5 hover:border-white/10 active:scale-95 cursor-pointer'
              }`}
              title={t("common.back")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Números de página */}
            {pageNumbers.map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="w-10 h-10 flex items-center justify-center text-xs font-black text-white/30 font-mono select-none"
                  >
                    ...
                  </span>
                );
              }

              const isPageActive = page === currentPage;

              return (
                <button
                  key={`page-${page}`}
                  onClick={() => handlePageChange(Number(page))}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                    isPageActive
                      ? 'bg-gradient-to-r from-accent via-fuchsia-600 to-accent text-white border border-fuchsia-400/40 shadow-[0_0_20px_rgba(217,70,239,0.3)] scale-105'
                      : 'border border-white/5 bg-white/[0.02] text-[#84849b] hover:text-white hover:bg-white/5 hover:border-white/10 active:scale-95'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Botón Siguiente */}
            <button
              onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 bg-white/[0.02] text-[#84849b] transition-all duration-300 ${
                currentPage === totalPages
                  ? 'opacity-40 cursor-not-allowed text-white/20'
                  : 'hover:text-white hover:bg-white/5 hover:border-white/10 active:scale-95 cursor-pointer'
              }`}
              title={t("common.next")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </nav>
        )}
      </div>
    </div>
  );
};
