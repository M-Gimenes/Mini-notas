// src/components/EstadoCarregando.tsx
type Props = { mensagem?: string };

export function EstadoCarregando({ mensagem = 'Carregando...' }: Props) {
  return (
    <div className="d-flex align-items-center gap-2 text-secondary py-4">
      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{mensagem}</span>
    </div>
  );
}