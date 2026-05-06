"use client";

import { useEffect, useState } from 'react';
import { Skin } from '../domain/skin';
import { GetSkinsUseCase } from '../application/get-skins.use-case';
import { ApiSkinRepository } from '../infrastructure/api-skin-repository';

export const useSkins = () => {
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSkins = async () => {
      setLoading(true);
      setError(null);
      try {
        const repository = new ApiSkinRepository();
        const useCase = new GetSkinsUseCase(repository);
        const data = await useCase.execute();
        
        if (data && data.length > 0) {
          setSkins(data);
        } else {
          setSkins([]);
        }
      } catch (err: any) {
        console.error("Error fetching skins from API:", err);
        setError(err.message || "Error al cargar skins de la tienda");
        setSkins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSkins();
  }, []);

  return { skins, loading, error };
};
