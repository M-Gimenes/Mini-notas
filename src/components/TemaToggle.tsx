// src/components/TemaToggle.tsx
import { useTema } from '../contexts/TemaContext';

export function TemaToggle() {
  const { tema, alternar } = useTema();
  return (
    <button
      className="btn btn-outline-secondary btn-sm"
      onClick={alternar}
      aria-label="Alternar tema claro/escuro"
    >
      {tema === 'claro' ? '🌙 Escuro' : '☀️ Claro'}
    </button>
  );
}