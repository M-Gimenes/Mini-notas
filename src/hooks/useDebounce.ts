// src/hooks/useDebounce.ts
import { useState, useEffect } from 'react';

export function useDebounce<T>(valor: T, ms: number): T {
  const [valorAtrasado, setValorAtrasado] = useState(valor);

  useEffect(() => {
    const id = setTimeout(() => setValorAtrasado(valor), ms);
    return () => clearTimeout(id); // cancela o timer anterior a cada tecla
  }, [valor, ms]);

  return valorAtrasado;
}