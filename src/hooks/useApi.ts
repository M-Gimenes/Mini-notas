// src/hooks/useApi.ts
import { useState, useEffect, useCallback } from 'react';

type EstadoApi<T> = {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
};

/**
 * Executa uma função assíncrona e expõe { dados, carregando, erro, recarregar }.
 * - Re-executa quando `deps` muda.
 * - Cancela a requisição anterior (AbortController) para evitar "race conditions".
 *
 * @param buscarDados recebe um AbortSignal; passe-o adiante para o fetch.
 * @param deps        lista de dependências (igual ao 2º argumento do useEffect).
 */
export function useApi<T>(
  buscarDados: (sinal: AbortSignal) => Promise<T>,
  deps: unknown[]
) {
  const [estado, setEstado] = useState<EstadoApi<T>>({
    dados: null,
    carregando: true,
    erro: null,
  });

  const [gatilho, setGatilho] = useState(0);
  const recarregar = useCallback(() => setGatilho((g) => g + 1), []);

  // "Congela" a função entre renders; só muda quando `deps` muda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(buscarDados, deps);

  useEffect(() => {
    const controlador = new AbortController();
    setEstado((s) => ({ ...s, carregando: true, erro: null }));

    executar(controlador.signal)
      .then((dados) => setEstado({ dados, carregando: false, erro: null }))
      .catch((e: unknown) => {
        if (controlador.signal.aborted) return; // requisição cancelada: ignore
        setEstado({ dados: null, carregando: false, erro: (e as Error).message });
      });

    return () => controlador.abort(); // cancela ao trocar deps / desmontar
  }, [executar, gatilho]);

  return { ...estado, recarregar };
}