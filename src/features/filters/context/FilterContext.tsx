"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  Suspense,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { stripLocaleFromPathname } from "@/shared/i18n/routing";

export type SortOption =
  | "Precio: Mayor a Menor"
  | "Precio: Menor a Mayor"
  | "Float: Menor a Mayor"
  | "Float: Mayor a Menor"
  | "Más recientes";

export interface FilterState {
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  selectedCategories: string[];
  selectedConditions: string[];
  sortOption: SortOption;
  immediateTradeOnly: boolean;
  groupSameItems: boolean;
}

interface FilterContextType extends FilterState {
  filterState: FilterState;
  filtersReady: boolean;
  atomicCommitVersion: number;
  setSearchQuery: (value: string) => void;
  setMinPrice: (value: string) => void;
  setMaxPrice: (value: string) => void;
  toggleCategory: (category: string) => void;
  toggleCondition: (condition: string) => void;
  setSortOption: (option: SortOption) => void;
  setImmediateTradeOnly: (value: boolean) => void;
  setGroupSameItems: (value: boolean) => void;
  replaceFilters: (state: FilterState) => void;
  clearFilters: () => void;
}

const DEFAULT_FILTER_STATE: FilterState = {
  searchQuery: "",
  minPrice: "",
  maxPrice: "",
  selectedCategories: [],
  selectedConditions: [],
  sortOption: "Precio: Mayor a Menor",
  immediateTradeOnly: false,
  groupSameItems: true,
};

export function cloneFilterState(state: FilterState): FilterState {
  return {
    ...state,
    selectedCategories: [...state.selectedCategories],
    selectedConditions: [...state.selectedConditions],
  };
}

export function createDefaultFilterState(): FilterState {
  return cloneFilterState(DEFAULT_FILTER_STATE);
}

const FILTER_ROUTES = new Set(["/buy", "/market", "/sell"]);
const FILTER_QUERY_KEYS = [
  "search",
  "minPrice",
  "maxPrice",
  "categories",
  "conditions",
  "sort",
  "immediate",
  "group",
  // Legacy keys are deleted when rewriting the URL.
  "q",
  "min",
  "max",
  "cat",
  "cond",
  "instant",
];
const SORT_OPTIONS: SortOption[] = [
  "Precio: Mayor a Menor",
  "Precio: Menor a Mayor",
  "Float: Menor a Mayor",
  "Float: Mayor a Menor",
  "Más recientes",
];

const SORT_LABEL_TO_TOKEN: Record<SortOption, string> = {
  "Precio: Mayor a Menor": "price_desc",
  "Precio: Menor a Mayor": "price_asc",
  "Float: Menor a Mayor": "float_asc",
  "Float: Mayor a Menor": "float_desc",
  "Más recientes": "newest",
};

const SORT_TOKEN_TO_LABEL: Record<string, SortOption> = {
  price_desc: "Precio: Mayor a Menor",
  price_asc: "Precio: Menor a Mayor",
  float_asc: "Float: Menor a Mayor",
  float_desc: "Float: Mayor a Menor",
  newest: "Más recientes",
};

const CATEGORY_LABEL_TO_TOKEN: Record<string, string> = {
  Cuchillos: "knives",
  Guantes: "gloves",
  Pistolas: "pistols",
  Subfusiles: "smgs",
  "Rifles de asalto": "rifles",
  "Rifles de francotirador": "snipers",
  Escopetas: "shotguns",
  Ametralladoras: "machine_guns",
  Agentes: "agents",
  Contenedores: "containers",
  "Kits musicales": "music_kits",
  Parches: "patches",
  Pegatinas: "stickers",
};

const CATEGORY_TOKEN_TO_LABEL = Object.fromEntries(
  Object.entries(CATEGORY_LABEL_TO_TOKEN).map(([label, token]) => [token, label]),
) as Record<string, string>;

const CONDITION_LABEL_TO_TOKEN: Record<string, string> = {
  "Recién fabricado": "factory_new",
  "Casi nuevo": "minimal_wear",
  "Algo desgastado": "field_tested",
  "Bastante desgastado": "well_worn",
  Deplorable: "battle_scarred",
};

const CONDITION_TOKEN_TO_LABEL = Object.fromEntries(
  Object.entries(CONDITION_LABEL_TO_TOKEN).map(([label, token]) => [token, label]),
) as Record<string, string>;

function parseListParam(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseSortOption(value: string | null): SortOption {
  if (value && SORT_TOKEN_TO_LABEL[value]) {
    return SORT_TOKEN_TO_LABEL[value];
  }

  return SORT_OPTIONS.includes(value as SortOption)
    ? (value as SortOption)
    : DEFAULT_FILTER_STATE.sortOption;
}

function labelsFromTokens(values: string[], tokenToLabel: Record<string, string>): string[] {
  return values.map((value) => tokenToLabel[value] ?? value);
}

function tokensFromLabels(values: string[], labelToToken: Record<string, string>): string[] {
  return values.map((value) => labelToToken[value] ?? value);
}

export function filterStateFromSearchParams(params: URLSearchParams): FilterState {
  return {
    searchQuery: params.get("search") ?? params.get("q") ?? DEFAULT_FILTER_STATE.searchQuery,
    minPrice: params.get("minPrice") ?? params.get("min") ?? DEFAULT_FILTER_STATE.minPrice,
    maxPrice: params.get("maxPrice") ?? params.get("max") ?? DEFAULT_FILTER_STATE.maxPrice,
    selectedCategories: labelsFromTokens(
      parseListParam(params.get("categories") ?? params.get("cat")),
      CATEGORY_TOKEN_TO_LABEL,
    ),
    selectedConditions: labelsFromTokens(
      parseListParam(params.get("conditions") ?? params.get("cond")),
      CONDITION_TOKEN_TO_LABEL,
    ),
    sortOption: parseSortOption(params.get("sort")),
    immediateTradeOnly: (params.get("immediate") ?? params.get("instant")) === "1",
    groupSameItems: params.get("group") !== "0",
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

  if (state.searchQuery.trim()) next.set("search", state.searchQuery.trim());
  if (state.minPrice.trim()) next.set("minPrice", state.minPrice.trim());
  if (state.maxPrice.trim()) next.set("maxPrice", state.maxPrice.trim());
  if (state.selectedCategories.length > 0) {
    next.set(
      "categories",
      tokensFromLabels(state.selectedCategories, CATEGORY_LABEL_TO_TOKEN).join(","),
    );
  }
  if (state.selectedConditions.length > 0) {
    next.set(
      "conditions",
      tokensFromLabels(state.selectedConditions, CONDITION_LABEL_TO_TOKEN).join(","),
    );
  }
  if (state.sortOption !== DEFAULT_FILTER_STATE.sortOption) {
    next.set("sort", SORT_LABEL_TO_TOKEN[state.sortOption]);
  }
  if (state.immediateTradeOnly) next.set("immediate", "1");
  if (!state.groupSameItems) next.set("group", "0");

  return next;
}

export function getFilterSignature(state: FilterState): string {
  return JSON.stringify(state);
}

export function getDelayedFilterSignature(state: FilterState): string {
  return JSON.stringify({
    searchQuery: state.searchQuery,
    minPrice: state.minPrice,
    maxPrice: state.maxPrice,
  });
}

export function getImmediateFilterSignature(state: FilterState): string {
  return JSON.stringify({
    selectedCategories: state.selectedCategories,
    selectedConditions: state.selectedConditions,
    sortOption: state.sortOption,
    immediateTradeOnly: state.immediateTradeOnly,
    groupSameItems: state.groupSameItems,
  });
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

const FilterUrlSync = ({
  urlHydrated,
  setUrlHydrated,
  applyFilterState,
  shouldSyncUrl,
  pathname,
  router,
  filterState,
  atomicCommitVersion,
}: {
  urlHydrated: boolean;
  setUrlHydrated: (value: boolean) => void;
  applyFilterState: (state: FilterState) => void;
  shouldSyncUrl: boolean;
  pathname: string | null;
  router: ReturnType<typeof useRouter>;
  filterState: FilterState;
  atomicCommitVersion: number;
}) => {
  const searchParams = useSearchParams();
  const locationKey = pathname ? `${pathname}?${searchParams.toString()}` : "";
  const hydratedLocationRef = useRef<string | null>(null);
  const lastFilterSignatureRef = useRef<string | null>(null);
  const observedFilterStateRef = useRef<FilterState | null>(null);
  const observedAtomicCommitRef = useRef(atomicCommitVersion);
  const selfWrittenLocationsRef = useRef(new Set<string>());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    if (!shouldSyncUrl) {
      hydratedLocationRef.current = null;
      lastFilterSignatureRef.current = null;
      observedFilterStateRef.current = null;
      selfWrittenLocationsRef.current.clear();
      timer = setTimeout(() => {
        applyFilterState(createDefaultFilterState());
        setUrlHydrated(false);
      }, 0);
      return () => {
        if (timer) clearTimeout(timer);
      };
    }

    timer = setTimeout(() => {
      const stateFromUrl = filterStateFromSearchParams(
        new URLSearchParams(searchParams.toString()),
      );
      const urlSignature = getFilterSignature(stateFromUrl);
      const isSelfWritten = selfWrittenLocationsRef.current.delete(locationKey);

      hydratedLocationRef.current = locationKey;
      if (!isSelfWritten && lastFilterSignatureRef.current !== urlSignature) {
        lastFilterSignatureRef.current = urlSignature;
        applyFilterState(stateFromUrl);
      } else if (lastFilterSignatureRef.current === null) {
        lastFilterSignatureRef.current = urlSignature;
      }
      setUrlHydrated(true);
    }, 0);

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    applyFilterState,
    locationKey,
    searchParams,
    setUrlHydrated,
    shouldSyncUrl,
  ]);

  useEffect(() => {
    if (!shouldSyncUrl || !urlHydrated || !pathname) return;
    if (hydratedLocationRef.current !== locationKey) return;

    const previousState = observedFilterStateRef.current;
    const isAtomicCommit = observedAtomicCommitRef.current !== atomicCommitVersion;
    observedFilterStateRef.current = cloneFilterState(filterState);
    observedAtomicCommitRef.current = atomicCommitVersion;

    const onlyDelayedFieldsChanged =
      !isAtomicCommit &&
      previousState !== null &&
      getDelayedFilterSignature(previousState) !== getDelayedFilterSignature(filterState) &&
      getImmediateFilterSignature(previousState) === getImmediateFilterSignature(filterState);

    const timer = setTimeout(() => {
      const currentParams = new URLSearchParams(searchParams.toString());
      const nextSignature = getFilterSignature(filterState);
      const filtersChanged =
        lastFilterSignatureRef.current !== null &&
        lastFilterSignatureRef.current !== nextSignature;
      const nextParams = writeFilterStateToSearchParams(currentParams, filterState);

      if (filtersChanged) nextParams.delete("page");

      const currentQuery = currentParams.toString();
      const nextQuery = nextParams.toString();
      lastFilterSignatureRef.current = nextSignature;
      if (currentQuery === nextQuery) return;

      const nextLocationKey = `${pathname}?${nextQuery}`;
      const selfWrittenLocations = selfWrittenLocationsRef.current;
      selfWrittenLocations.add(nextLocationKey);
      while (selfWrittenLocations.size > 25) {
        const oldestLocation = selfWrittenLocations.values().next().value;
        if (typeof oldestLocation !== "string") break;
        selfWrittenLocations.delete(oldestLocation);
      }

      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    }, onlyDelayedFieldsChanged ? 300 : 0);

    return () => clearTimeout(timer);
  }, [
    atomicCommitVersion,
    filterState,
    locationKey,
    pathname,
    router,
    searchParams,
    shouldSyncUrl,
    urlHydrated,
  ]);

  return null;
};

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const shouldSyncUrl = FILTER_ROUTES.has(stripLocaleFromPathname(pathname));
  const [{ filterState, atomicCommitVersion }, setFilterStore] = useState(() => ({
    filterState: createDefaultFilterState(),
    atomicCommitVersion: 0,
  }));
  const [urlHydrated, setUrlHydrated] = useState(false);

  const applyFilterState = useCallback((state: FilterState) => {
    setFilterStore((current) => ({
      ...current,
      filterState: cloneFilterState(state),
    }));
  }, []);

  const replaceFilters = useCallback((state: FilterState) => {
    setFilterStore((current) => ({
      filterState: cloneFilterState(state),
      atomicCommitVersion: current.atomicCommitVersion + 1,
    }));
  }, []);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilterStore((current) => ({
      ...current,
      filterState: { ...current.filterState, searchQuery },
    }));
  }, []);

  const setMinPrice = useCallback((minPrice: string) => {
    setFilterStore((current) => ({
      ...current,
      filterState: { ...current.filterState, minPrice },
    }));
  }, []);

  const setMaxPrice = useCallback((maxPrice: string) => {
    setFilterStore((current) => ({
      ...current,
      filterState: { ...current.filterState, maxPrice },
    }));
  }, []);

  const toggleCategory = useCallback((category: string) => {
    setFilterStore((current) => ({
      ...current,
      filterState: {
        ...current.filterState,
        selectedCategories: current.filterState.selectedCategories.includes(category)
          ? current.filterState.selectedCategories.filter((item) => item !== category)
          : [...current.filterState.selectedCategories, category],
      },
    }));
  }, []);

  const toggleCondition = useCallback((condition: string) => {
    setFilterStore((current) => ({
      ...current,
      filterState: {
        ...current.filterState,
        selectedConditions: current.filterState.selectedConditions.includes(condition)
          ? current.filterState.selectedConditions.filter((item) => item !== condition)
          : [...current.filterState.selectedConditions, condition],
      },
    }));
  }, []);

  const setSortOption = useCallback((sortOption: SortOption) => {
    setFilterStore((current) => ({
      ...current,
      filterState: { ...current.filterState, sortOption },
    }));
  }, []);

  const setImmediateTradeOnly = useCallback((immediateTradeOnly: boolean) => {
    setFilterStore((current) => ({
      ...current,
      filterState: { ...current.filterState, immediateTradeOnly },
    }));
  }, []);

  const setGroupSameItems = useCallback((groupSameItems: boolean) => {
    setFilterStore((current) => ({
      ...current,
      filterState: { ...current.filterState, groupSameItems },
    }));
  }, []);

  const clearFilters = useCallback(() => {
    replaceFilters(createDefaultFilterState());
  }, [replaceFilters]);

  return (
    <FilterContext.Provider
      value={{
        ...filterState,
        filterState,
        filtersReady: !shouldSyncUrl || urlHydrated,
        atomicCommitVersion,
        setSearchQuery,
        setMinPrice,
        setMaxPrice,
        toggleCategory,
        toggleCondition,
        setSortOption,
        setImmediateTradeOnly,
        setGroupSameItems,
        replaceFilters,
        clearFilters,
      }}
    >
      <Suspense fallback={null}>
        <FilterUrlSync
          urlHydrated={urlHydrated}
          setUrlHydrated={setUrlHydrated}
          applyFilterState={applyFilterState}
          shouldSyncUrl={shouldSyncUrl}
          pathname={pathname}
          router={router}
          filterState={filterState}
          atomicCommitVersion={atomicCommitVersion}
        />
      </Suspense>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used inside FilterProvider");
  return context;
};
