// src/api/http.ts

const BASE_URL = import.meta.env.VITE_API_URL;

if (!BASE_URL) {
  throw new Error(
    'VITE_API_URL não definida. Crie um arquivo .env na raiz com VITE_API_URL=<sua URL do MockAPI>.'
  );
}

/** Erro de HTTP que carrega o status, para quem chama poder reagir (ex.: 404). */
export class ErroHttp extends Error {
  status: number;

  constructor(status: number, mensagem: string) {
    super(mensagem);
    this.name = 'ErroHttp';
    this.status = status;
  }
}

// Obs.: declaramos o campo `status` explicitamente em vez de usar a "parameter
// property" do TypeScript (`constructor(public status: number, ...)`). Os templates
// recentes do Vite ativam a opção `erasableSyntaxOnly`, que proíbe sintaxes que
// geram código em runtime — e parameter properties são uma delas (erro TS1294).

type OpcoesPedido = {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  corpo?: unknown;
  sinal?: AbortSignal; // permite cancelar a requisição
};

/**
 * Faz uma requisição ao backend e devolve o JSON já tipado.
 * Centraliza headers, serialização e tratamento de erro num só lugar.
 */
export async function pedir<T>(caminho: string, opcoes: OpcoesPedido = {}): Promise<T> {
  const { metodo = 'GET', corpo, sinal } = opcoes;

  const resposta = await fetch(`${BASE_URL}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' }, // exigido pelo MockAPI
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    signal: sinal,
  });

  if (!resposta.ok) {
    throw new ErroHttp(resposta.status, `Falha HTTP ${resposta.status} em ${caminho}`);
  }

  // Algumas respostas (ex.: 204 No Content) não têm corpo.
  if (resposta.status === 204) {
    return undefined as T;
  }

  return (await resposta.json()) as T;
}