import { Skin, SkinRepository } from "../domain/skin";

export class GetSkinsUseCase {
  constructor(private skinRepository: SkinRepository) {}

  async execute(): Promise<Skin[]> {
    return this.skinRepository.getSkins();
  }
}
