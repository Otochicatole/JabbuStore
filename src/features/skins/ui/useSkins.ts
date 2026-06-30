"use client";

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFilters } from '@/features/filters/context/FilterContext';
import { Skin, SkinPagination } from '../domain/skin';
import { GetSkinsUseCase } from '../application/get-skins.use-case';
import { ApiSkinRepository } from '../infrastructure/api-skin-repository';

const DEFAULT_PAGINATION: SkinPagination = {
  page: 1,
  limit: 40,
  total: 0,
  totalPages: 1,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error al cargar skins de la tienda";
}

export const useSkins = () => {
  const filters = useFilters();
  const searchParams = useSearchParams();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [pagination, setPagination] = useState<SkinPagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const fetchSkins = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const repository = new ApiSkinRepository();
      const useCase = new GetSkinsUseCase(repository);
      const data = await useCase.execute({
        page,
        limit: DEFAULT_PAGINATION.limit,
        search: filters.searchQuery,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        categories: filters.selectedCategories,
        conditions: filters.selectedConditions,
        sort: filters.sortOption,
        immediate: filters.immediateTradeOnly,
        group: filters.groupSameItems,
      });
      
      if (data.items && data.items.length > 0) {
        setSkins(data.items);
      } else {
        setSkins([]);
      }
      setPagination(data.pagination);
    } catch (err: unknown) {
      console.error("Error fetching skins from API:", err);
      setError(getErrorMessage(err));
      setSkins([]);
      setPagination(DEFAULT_PAGINATION);
    } finally {
      setLoading(false);
    }
  }, [
    filters.groupSameItems,
    filters.immediateTradeOnly,
    filters.maxPrice,
    filters.minPrice,
    filters.searchQuery,
    filters.selectedCategories,
    filters.selectedConditions,
    filters.sortOption,
    page,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSkins();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchSkins]);

  return { skins, pagination, loading, error, refetch: fetchSkins };
};
