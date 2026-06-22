// src/types/Nota.ts

export type Nota = {
  id: string;           // gerado pelo servidor (MockAPI)
  titulo: string;
  conteudo: string;
  tags: string[];
  criadaEm: string;     // ISO string
  atualizadaEm: string; // ISO string
};

// O que ENVIAMOS ao criar/atualizar.
// O servidor é dono do `id`, então ele NUNCA vai no corpo da requisição.
export type NotaPayload = Omit<Nota, 'id'>;
