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
  groupSameItems: boolean;
}

interface FilterContextType extends FilterState {
  setSearchQuery: (v: string) => void;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  toggleCategory: (cat: string) => void;
  toggleCondition: (cond: string) => void;
  setSortOption: (opt: SortOption) => void;
  setImmediateTradeOnly: (v: boolean) => void;
  setGroupSameItems: (v: boolean) => void;
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
  groupSameItems: false,
};

const FILTER_ROUTES = new Set(["/buy", "/sell"]);
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
    : defaultState.sortOption;
}

function labelsFromTokens(values: string[], tokenToLabel: Record<string, string>): string[] {
  return values.map((value) => tokenToLabel[value] ?? value);
}

function tokensFromLabels(values: string[], labelToToken: Record<string, string>): string[] {
  return values.map((value) => labelToToken[value] ?? value);
}

function filterStateFromSearchParams(params: URLSearchParams): FilterState {
  return {
    searchQuery: params.get("search") ?? params.get("q") ?? defaultState.searchQuery,
    minPrice: params.get("minPrice") ?? params.get("min") ?? defaultState.minPrice,
    maxPrice: params.get("maxPrice") ?? params.get("max") ?? defaultState.maxPrice,
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
    groupSameItems: params.get("group") === "1",
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
  if (state.sortOption !== defaultState.sortOption) {
    next.set("sort", SORT_LABEL_TO_TOKEN[state.sortOption]);
  }
  if (state.immediateTradeOnly) next.set("immediate", "1");
  if (state.groupSameItems) next.set("group", "1");

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
  const [groupSameItems, setGroupSameItems] = useState(false);
  const [urlHydrated, setUrlHydrated] = useState(false);

  const applyFilterState = useCallback((state: FilterState) => {
    setSearchQuery(state.searchQuery);
    setMinPrice(state.minPrice);
    setMaxPrice(state.maxPrice);
    setSelectedCategories(state.selectedCategories);
    setSelectedConditions(state.selectedConditions);
    setSortOption(state.sortOption);
    setImmediateTradeOnly(state.immediateTradeOnly);
    setGroupSameItems(state.groupSameItems);
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
      groupSameItems,
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
    groupSameItems,
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
        groupSameItems, setGroupSameItems,
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
