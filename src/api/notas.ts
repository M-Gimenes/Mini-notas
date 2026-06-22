// src/api/notas.ts
import { pedir, ErroHttp } from './http';
import type { Nota, NotaPayload } from '../types/Nota';

const RECURSO = '/notas';

/**
 * Lista notas, opcionalmente filtrando por texto (busca no SERVIDOR).
 * Ordena pela data de atualização, mais recentes primeiro.
 */
export async function listarNotas(busca = '', sinal?: AbortSignal): Promise<Nota[]> {
  const params = new URLSearchParams({ sortBy: 'atualizadaEm', order: 'desc' });
  if (busca.trim()) {
    params.set('search', busca.trim());
  }

  try {
    return await pedir<Nota[]>(`${RECURSO}?${params.toString()}`, { sinal });
  } catch (e) {
    // Gotcha do MockAPI: lista filtrada sem resultados volta 404.
    // Para nós, isso significa "nenhuma nota" — devolvemos lista vazia.
    if (e instanceof ErroHttp && e.status === 404) {
      return [];
    }
    throw e;
  }
}

/** Busca uma nota específica pelo id. */
export function obterNota(id: string, sinal?: AbortSignal): Promise<Nota> {
  return pedir<Nota>(`${RECURSO}/${id}`, { sinal });
}

/** Cria uma nota. O servidor devolve a nota já com `id`. */
export function criarNota(payload: NotaPayload): Promise<Nota> {
  return pedir<Nota>(RECURSO, { metodo: 'POST', corpo: payload });
}

/** Atualiza uma nota existente. */
export function atualizarNota(id: string, payload: NotaPayload): Promise<Nota> {
  return pedir<Nota>(`${RECURSO}/${id}`, { metodo: 'PUT', corpo: payload });
}

/** Exclui uma nota. */
export function excluirNota(id: string): Promise<Nota> {
  return pedir<Nota>(`${RECURSO}/${id}`, { metodo: 'DELETE' });
}