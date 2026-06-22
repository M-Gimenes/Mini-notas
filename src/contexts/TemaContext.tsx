// src/contexts/TemaContext.tsx
import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

type Tema = 'claro' | 'escuro';

type TemaContextValue = {
  tema: Tema;
  alternar: () => void;
};

const TemaContext = createContext<TemaContextValue | null>(null);

export function TemaProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useLocalStorage<Tema>('mini-notas:tema', 'claro');

  // Bootstrap 5.3 lê o atributo data-bs-theme do elemento raiz (<html>).
  useEffect(() => {
    document.documentElement.setAttribute(
      'data-bs-theme',
      tema === 'escuro' ? 'dark' : 'light'
    );
  }, [tema]);

  function alternar() {
    setTema((t) => (t === 'claro' ? 'escuro' : 'claro'));
  }

  return (
    <TemaContext.Provider value={{ tema, alternar }}>
      {children}
    </TemaContext.Provider>
  );
}

export function useTema(): TemaContextValue {
  const ctx = useContext(TemaContext);
  if (ctx === null) throw new Error('useTema precisa de TemaProvider');
  return ctx;
}