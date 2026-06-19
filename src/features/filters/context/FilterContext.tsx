"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type SortOption = "Precio: Mayor a Menor" | "Precio: Menor a Mayor" | "Float: Menor a Mayor" | "Float: Mayor a Menor" | "Más recientes";

export interface FilterState {
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  selectedCategories: string[];
  selectedConditions: string[];
  sortOption: SortOption;
  immediateTradeOnly: boolean;
}

interface FilterContextType extends FilterState {
  setSearchQuery: (v: string) => void;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  toggleCategory: (cat: string) => void;
  toggleCondition: (cond: string) => void;
  setSortOption: (opt: SortOption) => void;
  setImmediateTradeOnly: (v: boolean) => void;
  clearFilters: () => void;
}

const defaultState: FilterState = {
  searchQuery: "",
  minPrice: "",
  maxPrice: "",
  selectedCategories: [],
  selectedConditions: [],
  sortOption: "Precio: Mayor a Menor",
  immediateTradeOnly: false,
};

const FILTER_ROUTES = new Set(["/buy", "/sell"]);
const FILTER_QUERY_KEYS = ["q", "min", "max", "cat", "cond", "sort", "instant"];
const SORT_OPTIONS: SortOption[] = [
  "Precio: Mayor a Menor",
  "Precio: Menor a Mayor",
  "Float: Menor a Mayor",
  "Float: Mayor a Menor",
  "Más recientes",
];

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSortOption(value: string | null): SortOption {
  return SORT_OPTIONS.includes(value as SortOption)
    ? (value as SortOption)
    : defaultState.sortOption;
}

function filterStateFromSearchParams(params: URLSearchParams): FilterState {
  return {
    searchQuery: params.get("q") ?? defaultState.searchQuery,
    minPrice: params.get("min") ?? defaultState.minPrice,
    maxPrice: params.get("max") ?? defaultState.maxPrice,
    selectedCategories: parseListParam(params.get("cat")),
    selectedConditions: parseListParam(params.get("cond")),
    sortOption: parseSortOption(params.get("sort")),
    immediateTradeOnly: params.get("instant") === "1",
  };
}

function writeFilterStateToSearchParams(
  params: URLSearchParams,
  state: FilterState,
): URLSearchParams {
  const next = new URLSearchParams(params.toString());
  for (const key of FILTER_QUERY_KEYS) {
    next.delete(key);
  }

  if (state.searchQuery.trim()) next.set("q", state.searchQuery.trim());
  if (state.minPrice.trim()) next.set("min", state.minPrice.trim());
  if (state.maxPrice.trim()) next.set("max", state.maxPrice.trim());
  if (state.selectedCategories.length > 0) {
    next.set("cat", state.selectedCategories.join(","));
  }
  if (state.selectedConditions.length > 0) {
    next.set("cond", state.selectedConditions.join(","));
  }
  if (state.sortOption !== defaultState.sortOption) {
    next.set("sort", state.sortOption);
  }
  if (state.immediateTradeOnly) next.set("instant", "1");

  return next;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const shouldSyncUrl = FILTER_ROUTES.has(pathname ?? "");

  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("Precio: Mayor a Menor");
  const [immediateTradeOnly, setImmediateTradeOnly] = useState(false);
  const [urlHydrated, setUrlHydrated] = useState(false);

  const applyFilterState = useCallback((state: FilterState) => {
    setSearchQuery(state.searchQuery);
    setMinPrice(state.minPrice);
    setMaxPrice(state.maxPrice);
    setSelectedCategories(state.selectedCategories);
    setSelectedConditions(state.selectedConditions);
    setSortOption(state.sortOption);
    setImmediateTradeOnly(state.immediateTradeOnly);
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (!shouldSyncUrl) {
      timer = setTimeout(() => {
        applyFilterState(defaultState);
        setUrlHydrated(false);
      }, 0);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    timer = setTimeout(() => {
      applyFilterState(
        filterStateFromSearchParams(
          new URLSearchParams(searchParams.toString()),
        ),
      );
      setUrlHydrated(true);
    }, 0);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [applyFilterState, pathname, searchParams, shouldSyncUrl]);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  }, []);

  const toggleCondition = useCallback((cond: string) => {
    setSelectedConditions(prev =>
      prev.includes(cond) ? prev.filter(c => c !== cond) : [...prev, cond]
    );
  }, []);

  const clearFilters = useCallback(() => {
    applyFilterState(defaultState);
  }, [applyFilterState]);

  useEffect(() => {
    if (!shouldSyncUrl || !urlHydrated || !pathname) return;

    const currentParams = new URLSearchParams(searchParams.toString());
    const nextParams = writeFilterStateToSearchParams(currentParams, {
      searchQuery,
      minPrice,
      maxPrice,
      selectedCategories,
      selectedConditions,
      sortOption,
      immediateTradeOnly,
    });

    const currentQuery = currentParams.toString();
    const nextQuery = nextParams.toString();
    if (currentQuery === nextQuery) return;

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
      scroll: false,
    });
  }, [
    searchQuery,
    minPrice,
    maxPrice,
    selectedCategories,
    selectedConditions,
    sortOption,
    immediateTradeOnly,
    pathname,
    router,
    searchParams,
    shouldSyncUrl,
    urlHydrated,
  ]);

  return (
    <FilterContext.Provider
      value={{
        searchQuery, setSearchQuery,
        minPrice, setMinPrice,
        maxPrice, setMaxPrice,
        selectedCategories, toggleCategory,
        selectedConditions, toggleCondition,
        sortOption, setSortOption,
        immediateTradeOnly, setImmediateTradeOnly,
        clearFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used inside FilterProvider");
  return ctx;
};
