import {
  SkinCatalogQuery,
  SkinCatalogResult,
  SkinRepository,
} from "../domain/skin";

export class GetSkinsUseCase {
  constructor(private skinRepository: SkinRepository) {}

  async execute(query?: SkinCatalogQuery): Promise<SkinCatalogResult> {
    return this.skinRepository.getSkins(query);
  }
}
