"use client";

import { useEffect, useState } from 'react';
import { Skin } from '../domain/skin';
import { GetSkinsUseCase } from '../application/get-skins.use-case';
import { MockSkinRepository } from '../infrastructure/mock-skin-repository';

export const useSkins = () => {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkins = async () => {
      const repository = new MockSkinRepository();
      const useCase = new GetSkinsUseCase(repository);
      const data = await useCase.execute();
      setSkins(data);
      setLoading(false);
    };

    fetchSkins();
  }, []);

  return { skins, loading };
};
