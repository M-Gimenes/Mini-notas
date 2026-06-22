// src/components/EstadoErro.tsx
type Props = {
  mensagem: string;
  aoTentarDeNovo?: () => void;
};

export function EstadoErro({ mensagem, aoTentarDeNovo }: Props) {
  return (
    <div
      className="alert alert-danger d-flex justify-content-between align-items-center"
      role="alert"
    >
      <span>Algo deu errado: {mensagem}</span>
      {aoTentarDeNovo && (
        <button className="btn btn-sm btn-outline-danger" onClick={aoTentarDeNovo}>
          Tentar de novo
        </button>
      )}
    </div>
  );
}