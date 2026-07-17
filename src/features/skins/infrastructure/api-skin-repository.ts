import {
  Skin,
  SkinCatalogQuery,
  SkinCatalogResult,
  SkinPagination,
  SkinRarity,
  SkinRepository,
} from "../domain/skin";
import { BACKEND_URL } from "@/shared/lib/api";

export interface CatalogItemResponse {
  id: string;
  name: string;
  weapon: string;
  rarity?: string;
  price: number;
  imageUrl: string | null;
  float: number | null;
  pattern: number | null;
  exterior: string | null;
  category: string;
  isStatTrak: boolean;
  isSouvenir: boolean;
  phase: string | null;
  isImmediate: boolean;
  inspectLink: string | null;
  variants?: CatalogItemResponse[];
}

export interface CatalogItemsResponse {
  items: CatalogItemResponse[];
  pagination: SkinPagination;
}

function toSkinRarity(raw: string | undefined): SkinRarity {
  const normalized = (raw || "common").toLowerCase();
  const valid: SkinRarity[] = [
    "common",
    "uncommon",
    "rare",
    "mythical",
    "legendary",
    "ancient",
    "immortal",
  ];
  return valid.includes(normalized as SkinRarity)
    ? (normalized as SkinRarity)
    : "common";
}

function mapCatalogItemToSkin(item: CatalogItemResponse): Skin {
  const variants = item.variants?.map(mapCatalogItemToSkin);
  const skin: Skin = {
    id: item.id,
    name: item.name,
    weapon: item.weapon,
    rarity: toSkinRarity(item.rarity),
    price: item.price,
    imageUrl: item.imageUrl || "/skin.webp",
    float: item.float ?? undefined,
    pattern: item.pattern ?? undefined,
    exterior: item.exterior || null,
    category: item.category || "other",
    isStatTrak: item.isStatTrak || false,
    isSouvenir: item.isSouvenir || false,
    phase: item.phase ?? undefined,
    isImmediate: item.isImmediate,
    inspectLink: item.inspectLink,
  };

  if (variants && variants.length > 0) {
    skin.variants = variants;
  }

  return skin;
}

function appendListParam(params: URLSearchParams, key: string, values?: string[]) {
  if (values && values.length > 0) {
    params.set(key, values.join(","));
  }
}

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

const CONDITION_LABEL_TO_TOKEN: Record<string, string> = {
  "Recién fabricado": "factory_new",
  "Casi nuevo": "minimal_wear",
  "Algo desgastado": "field_tested",
  "Bastante desgastado": "well_worn",
  Deplorable: "battle_scarred",
};

const SORT_LABEL_TO_TOKEN: Record<string, string> = {
  "Precio: Mayor a Menor": "price_desc",
  "Precio: Menor a Mayor": "price_asc",
  "Float: Menor a Mayor": "float_asc",
  "Float: Mayor a Menor": "float_desc",
  "Más recientes": "newest",
};

function mapTokens(values: string[] | undefined, mapper: Record<string, string>): string[] | undefined {
  return values?.map((value) => mapper[value] ?? value);
}

function buildCatalogQuery(query: SkinCatalogQuery = {}): string {
  const params = new URLSearchParams();

  params.set("page", String(query.page ?? 1));
  params.set("limit", String(query.limit ?? 40));
  if (query.search?.trim()) params.set("search", query.search.trim());
  if (query.minPrice?.trim()) params.set("minPrice", query.minPrice.trim());
  if (query.maxPrice?.trim()) params.set("maxPrice", query.maxPrice.trim());
  appendListParam(params, "categories", mapTokens(query.categories, CATEGORY_LABEL_TO_TOKEN));
  appendListParam(params, "conditions", mapTokens(query.conditions, CONDITION_LABEL_TO_TOKEN));
  if (query.sort) params.set("sort", SORT_LABEL_TO_TOKEN[query.sort] ?? query.sort);
  if (query.immediate) params.set("immediate", "1");
  if (query.group) params.set("group", "1");

  return params.toString();
}

const emptyPagination = (query?: SkinCatalogQuery): SkinPagination => ({
  page: query?.page ?? 1,
  limit: query?.limit ?? 40,
  total: 0,
  totalPages: 1,
});

export class ApiSkinRepository implements SkinRepository {
  constructor(private readonly signal?: AbortSignal) {}

  async getSkins(query?: SkinCatalogQuery): Promise<SkinCatalogResult> {
    try {
      const response = await fetch(`${BACKEND_URL}/catalog/items?${buildCatalogQuery(query)}`, {
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
          Accept: "application/json",
        },
        credentials: "include",
        signal: this.signal,
      });

      if (!response.ok) {
        throw new Error("Error al cargar el catálogo de skins.");
      }

      const data = (await response.json()) as CatalogItemsResponse;
      return {
        items: Array.isArray(data.items) ? data.items.map(mapCatalogItemToSkin) : [],
        pagination: data.pagination ?? emptyPagination(query),
      };
    } catch (error) {
      if (this.signal?.aborted) throw error;
      console.error("Error in ApiSkinRepository.getSkins:", error);
      return {
        items: [],
        pagination: emptyPagination(query),
      };
    }
  }

  async getSkinById(id: string): Promise<Skin | null> {
    try {
      const result = await this.getSkins({ limit: 100 });
      const skins = result.items.flatMap((s) => s.variants ?? [s]);
      return skins.find((s) => s.id === id) || null;
    } catch (error) {
      if (this.signal?.aborted) throw error;
      console.error("Error in ApiSkinRepository.getSkinById:", error);
      return null;
    }
  }
}
