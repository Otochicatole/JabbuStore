"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type SortOption = "Precio: Mayor a Menor" | "Precio: Menor a Mayor" | "Float: Menor a Mayor" | "Float: Mayor a Menor" | "Más recientes";

export interface FilterState {
  searchQuery: string;
  minPrice: string;
  maxPrice: string;
  selectedCategories: string[];
  selectedConditions: string[];
  sortOption: SortOption;
}

interface FilterContextType extends FilterState {
  setSearchQuery: (v: string) => void;
  setMinPrice: (v: string) => void;
  setMaxPrice: (v: string) => void;
  toggleCategory: (cat: string) => void;
  toggleCondition: (cond: string) => void;
  setSortOption: (opt: SortOption) => void;
  clearFilters: () => void;
}

const defaultState: FilterState = {
  searchQuery: "",
  minPrice: "",
  maxPrice: "",
  selectedCategories: [],
  selectedConditions: [],
  sortOption: "Precio: Mayor a Menor",
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>("Precio: Mayor a Menor");

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
    setSearchQuery("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedCategories([]);
    setSelectedConditions([]);
    setSortOption("Precio: Mayor a Menor");
  }, []);

  return (
    <FilterContext.Provider
      value={{
        searchQuery, setSearchQuery,
        minPrice, setMinPrice,
        maxPrice, setMaxPrice,
        selectedCategories, toggleCategory,
        selectedConditions, toggleCondition,
        sortOption, setSortOption,
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
