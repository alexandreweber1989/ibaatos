import { useEffect, useState } from "react";

export type Estado = {
  id: number;
  sigla: string;
  nome: string;
};

export type Cidade = {
  id: number;
  nome: string;
};

export type Bairro = {
  id: number;
  nome: string;
};

export function useLocalidades() {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [bairros, setBairros] = useState<Bairro[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [loadingBairros, setLoadingBairros] = useState(false);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data) => setEstados(data))
      .catch((err) => console.error("Erro ao buscar estados:", err));
  }, []);

  const buscarCidades = async (uf: string) => {
    if (!uf) {
      setCidades([]);
      return;
    }
    setLoadingCidades(true);
    try {
      const res = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
      );
      const data = await res.json();
      setCidades(data);
    } catch (err) {
      console.error("Erro ao buscar cidades:", err);
    } finally {
      setLoadingCidades(false);
    }
  };

  const buscarBairros = async (cidadeId: number) => {
    if (!cidadeId) {
      setBairros([]);
      return;
    }
    setLoadingBairros(true);
    try {
      // A API do IBGE é limitada para bairros em muitas cidades.
      // Primeiro tentamos o endpoint de subdistritos (que costuma ter bairros em cidades grandes)
      // Se não houver, tentamos o de distritos.
      const resSub = await fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cidadeId}/subdistritos?orderBy=nome`,
      );
      let data = await resSub.json();

      if (!data || data.length === 0) {
        const resDist = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${cidadeId}/distritos?orderBy=nome`,
        );
        data = await resDist.json();
      }

      setBairros(data);
    } catch (err) {
      console.error("Erro ao buscar bairros:", err);
    } finally {
      setLoadingBairros(false);
    }
  };

  return {
    estados,
    cidades,
    bairros,
    buscarCidades,
    buscarBairros,
    loadingCidades,
    loadingBairros,
  };
}
