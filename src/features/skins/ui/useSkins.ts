"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  cloneFilterState,
  filterStateFromSearchParams,
  getDelayedFilterSignature,
  getFilterSignature,
  getImmediateFilterSignature,
  useFilters,
  type FilterState,
} from "@/features/filters/context/FilterContext";
import { Skin, SkinPagination } from "../domain/skin";
import { GetSkinsUseCase } from "../application/get-skins.use-case";
import { ApiSkinRepository } from "../infrastructure/api-skin-repository";

const DEFAULT_PAGINATION: SkinPagination = {
  page: 1,
  limit: 40,
  total: 0,
  totalPages: 1,
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Error al cargar skins de la tienda";
}

export const useSkins = (marketType: "express" | "market") => {
  const filters = useFilters();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [catalogFilters, setCatalogFilters] = useState<FilterState | null>(null);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [pagination, setPagination] = useState<SkinPagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const observedFiltersRef = useRef<FilterState | null>(null);
  const observedAtomicCommitRef = useRef(filters.atomicCommitVersion);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    if (!filters.filtersReady) return;

    const previousFilters = observedFiltersRef.current;
    const isAtomicCommit =
      observedAtomicCommitRef.current !== filters.atomicCommitVersion;
    const nextFilters = cloneFilterState(filters.filterState);

    observedFiltersRef.current = nextFilters;
    observedAtomicCommitRef.current = filters.atomicCommitVersion;

    const onlyDelayedFieldsChanged =
      !isAtomicCommit &&
      previousFilters !== null &&
      getDelayedFilterSignature(previousFilters) !== getDelayedFilterSignature(nextFilters) &&
      getImmediateFilterSignature(previousFilters) === getImmediateFilterSignature(nextFilters);

    const timer = setTimeout(() => {
      setCatalogFilters(nextFilters);
    }, onlyDelayedFieldsChanged ? 300 : 0);

    return () => clearTimeout(timer);
  }, [
    filters.atomicCommitVersion,
    filters.filterState,
    filters.filtersReady,
  ]);

  const pageFromUrl = Math.max(
    1,
    Number.parseInt(searchParams.get("page") ?? "1", 10) || 1,
  );
  const urlFilterSignature = useMemo(
    () => getFilterSignature(
      filterStateFromSearchParams(new URLSearchParams(searchParamsKey)),
    ),
    [searchParamsKey],
  );
  const catalogFilterSignature = catalogFilters
    ? getFilterSignature(catalogFilters)
    : null;
  const page =
    catalogFilterSignature !== null && catalogFilterSignature !== urlFilterSignature
      ? 1
      : pageFromUrl;

  useEffect(() => {
    if (!filters.filtersReady || catalogFilters === null) return;

    const controller = new AbortController();
    const requestId = ++requestSequenceRef.current;
    const timer = setTimeout(() => {
      const fetchSkins = async () => {
        setLoading(true);
        setError(null);

        try {
          const repository = new ApiSkinRepository(controller.signal);
          const useCase = new GetSkinsUseCase(repository);
          const data = await useCase.execute({
            page,
            limit: DEFAULT_PAGINATION.limit,
            search: catalogFilters.searchQuery,
            minPrice: catalogFilters.minPrice,
            maxPrice: catalogFilters.maxPrice,
            categories: catalogFilters.selectedCategories,
            conditions: catalogFilters.selectedConditions,
            sort: catalogFilters.sortOption,
            immediate: marketType === "express",
            group: catalogFilters.groupSameItems,
          });

          if (controller.signal.aborted || requestId !== requestSequenceRef.current) {
            return;
          }

          setSkins(Array.isArray(data.items) ? data.items : []);
          setPagination(data.pagination);
        } catch (requestError: unknown) {
          if (controller.signal.aborted || requestId !== requestSequenceRef.current) {
            return;
          }

          console.error("Error fetching skins from API:", requestError);
          setError(getErrorMessage(requestError));
          setSkins([]);
          setPagination(DEFAULT_PAGINATION);
        } finally {
          if (!controller.signal.aborted && requestId === requestSequenceRef.current) {
            setLoading(false);
          }
        }
      };

      void fetchSkins();
    }, 0);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [
    catalogFilters,
    filters.filtersReady,
    marketType,
    page,
    refreshVersion,
  ]);

  const refetch = useCallback(() => {
    setRefreshVersion((current) => current + 1);
  }, []);

  return { skins, pagination, loading, error, refetch };
};
