// src/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(chave: string, valorInicial: T) {
  const [valor, setValor] = useState<T>(() => {
    const cru = localStorage.getItem(chave);
    if (cru === null) return valorInicial;
    try {
      return JSON.parse(cru) as T;
    } catch {
      return valorInicial;
    }
  });

  useEffect(() => {
    localStorage.setItem(chave, JSON.stringify(valor));
  }, [chave, valor]);

  return [valor, setValor] as const;
}