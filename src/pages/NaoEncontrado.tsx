// src/pages/NaoEncontrado.tsx
import { Link } from 'react-router-dom';

export function NaoEncontrado() {
  return (
    <section className="text-center py-5">
      <h2 className="display-6">404</h2>
      <p className="text-secondary">Página não encontrada.</p>
      <Link to="/" className="btn btn-primary">
        Voltar para a lista
      </Link>
    </section>
  );
}
