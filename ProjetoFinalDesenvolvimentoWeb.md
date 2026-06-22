# Projeto Final — Mini Gerenciador de Notas com MockAPI.io

> Tutorial passo a passo do projeto final do curso **React Essencial**, do zero ao deploy local, trocando a persistência de `localStorage` por uma **API REST real hospedada no [MockAPI.io](https://mockapi.io)**.

---

## Índice

1. [O que vamos construir](#1-o-que-vamos-construir)
2. [Arquitetura: local vs. remoto](#2-arquitetura-local-vs-remoto)
3. [Pré-requisitos e stack](#3-pré-requisitos-e-stack)
4. [Passo 1 — Criar o projeto (Vite)](#4-passo-1--criar-o-projeto-vite)
5. [Passo 2 — Adicionar o Bootstrap 5.3.8](#5-passo-2--adicionar-o-bootstrap-538)
6. [Passo 3 — Estrutura de pastas](#6-passo-3--estrutura-de-pastas-explicada)
7. [Passo 4 — Configurar o MockAPI.io](#7-passo-4--configurar-o-mockapiio)
8. [Passo 5 — Variável de ambiente](#8-passo-5--variável-de-ambiente-vite_api_url)
9. [Passo 6 — Tipos centrais](#9-passo-6--tipos-centrais)
10. [Passo 7 — Camada de dados (a API)](#10-passo-7--camada-de-dados-a-api)
11. [Passo 8 — Custom hooks](#11-passo-8--custom-hooks)
12. [Passo 9 — Design system (componentes)](#12-passo-9--design-system-componentes)
13. [Passo 10 — Páginas](#13-passo-10--páginas)
14. [Passo 11 — Tema claro/escuro](#14-passo-11--tema-claroescuro)
15. [Passo 12 — App.tsx (rotas + providers)](#15-passo-12--apptsx-rotas--providers)
16. [Passo 13 — main.tsx e limpeza](#16-passo-13--maintsx-e-limpeza)
17. [Passo 14 — Rodar e testar](#17-passo-14--rodar-e-testar)
18. [Solução de problemas](#18-solução-de-problemas-troubleshooting)
19. [Desafios / extensões](#19-desafios--extensões)
20. [Atividade final (pratique sem código pronto)](#20-atividade-final-pratique-sem-código-pronto)

---

## 1. O que vamos construir

Um app de notas pequeno, mas com decisões de arquitetura reais:

- **CRUD de notas** — criar, ler, editar, excluir, agora via HTTP.
- **Tags** para categorizar cada nota.
- **Busca por texto** com **debounce**, executada **no servidor** (`?search=`).
- **Tema claro/escuro** persistente, usando o dark mode nativo do Bootstrap 5.3.
- **Estados de carregamento e erro** em toda operação remota (spinner + alerta).
- **Rotas**: `/` (lista), `/nova` (criar), `/nota/:id` (editar), `/sobre`, `*` (404).

Conceitos do curso exercitados: componentes e props (M02–M03), estado com `useState`
(M04), formulários controlados (M05), efeitos com `useEffect` (M06), Context (M08), custom
hooks (M09), roteamento (M11) e **dados assíncronos** (M12).

---

## 2. Arquitetura: local vs. remoto

No enunciado original, o estado das notas vivia em um `useReducer` global e era salvo
inteiro no `localStorage` a cada mudança:

```text
[componente] --dispatch--> [reducer no Context] --useEffect--> localStorage (array inteiro)
```

Com um backend real, o **servidor passa a ser a fonte da verdade**. Não faz sentido
"salvar o array inteiro": cada operação é uma chamada HTTP independente, e cada tela
**busca o que precisa quando precisa**:

```text
ListaNotas   --GET /notas?search=...-->  MockAPI   (carrega a lista)
EditorNota   --GET /notas/:id-------->   MockAPI   (carrega uma nota)
             --POST /notas------------>  MockAPI   (cria)
             --PUT /notas/:id--------->  MockAPI   (atualiza)
             --DELETE /notas/:id------>  MockAPI   (exclui)
```

Por isso, **abandonamos o `useReducer` global das notas** e adotamos a opção que você
escolheu: **custom hooks com `fetch`, um por recurso**. O Context continua presente — mas
só para o **tema**, que é justamente o tipo de estado global que não vem de um servidor.

Cada chamada remota tem três estados possíveis que a UI precisa refletir:

1. **Carregando** — mostramos um spinner.
2. **Erro** — mostramos um alerta com botão "tentar de novo".
3. **Sucesso** — mostramos os dados.

Esse trio (`carregando / erro / dados`) vai aparecer o tempo todo, então vamos encapsulá-lo
num hook reutilizável: o `useApi`.

---

## 3. Pré-requisitos e stack

- **Bun** instalado (`bun --version`). Se preferir, troque `bun` por `npm`/`pnpm` nos comandos.
- Uma conta gratuita no **[MockAPI.io](https://mockapi.io)**.
- Editor com suporte a TypeScript (VS Code recomendado).

| Camada        | Tecnologia                      |
| ------------- | ------------------------------- |
| Build/runtime | Vite + React 19 + TypeScript    |
| Roteamento    | React Router v7                 |
| Estilo        | Bootstrap 5.3.8 (CSS via CDN)   |
| Dados         | `fetch` nativo + custom hooks |
| Backend       | MockAPI.io (REST hospedado)     |
| Estado global | Context (apenas para tema)      |

---

## 4. Passo 1 — Criar o projeto (Vite)

```bash
# 1. Criar projeto a partir do template React + TypeScript
bun create vite mini-notas --template react-ts

# 2. Entrar na pasta
cd mini-notas

# 3. Instalar dependências
bun install

# 4. Adicionar o React Router
bun add react-router-dom

# 5. Subir o servidor de desenvolvimento
bun run dev
# Acesse http://localhost:5173
```

Depois de confirmar que a tela padrão do Vite abre, **remova os arquivos de exemplo** que
não vamos usar, para começar do zero:

- Apague `src/App.css` (o Bootstrap cuidará do estilo).
- Apague `src/index.css` (o Bootstrap cuidará do estilo).
- Apague a pasta `src/assets/` inteira (contém só o `react.svg` de exemplo).
- Apague `public/vite.svg` (logo de exemplo do Vite).
- Apague o **conteúdo** de `src/App.tsx` (o arquivo continua, mas vamos reescrevê-lo no Passo 12).

```bash
# A partir da raiz do projeto
rm -rf src/App.css src/index.css src/assets public/vite.svg
```

> **Atenção:** ao apagar `src/index.css`, lembre-se de remover também o `import './index.css'`
> do `src/main.tsx` (tratado no Passo 13), senão o build quebra por importar um arquivo que
> não existe mais.

---

## 5. Passo 2 — Adicionar o Bootstrap 5.3.8

Vamos usar o Bootstrap **pelo CSS oficial**, sem instalar `react-bootstrap`. Isso significa
escrever as **classes do Bootstrap** diretamente no JSX (`className="btn btn-primary"`),
exatamente como faríamos em HTML puro.

Abra `index.html` (na raiz do projeto) e deixe-o assim:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Mini Notas</title>

    <!-- Bootstrap 5.3.8 — CSS oficial via CDN -->
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css"
      rel="stylesheet"
      crossorigin="anonymous"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>

    <!-- Bootstrap JS bundle: necessário só para componentes interativos
         (dropdowns, navbar colapsável, toasts). Pode remover se não usar. -->
    <script
      src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"
      crossorigin="anonymous"
    ></script>
  </body>
</html>
```

> **Dica:** o site oficial ([getbootstrap.com](https://getbootstrap.com)) fornece o snippet
> com o atributo `integrity="sha384-..."` (verificação de integridade). É uma boa prática
> de produção copiá-lo de lá com o hash correto da versão 5.3.8. Omiti aqui para não fixar
> um hash que pode mudar.

Por que `<link>` e não `import 'bootstrap/dist/css/...'`? Ambos funcionam. Optamos pelo
`<link>` porque foi a escolha do projeto (CSS oficial no `index.html`) — é a forma mais
próxima de "usar Bootstrap como em HTML", sem acoplar o CSS ao bundle do Vite.

---

## 6. Passo 3 — Estrutura de pastas (explicada)

Crie esta estrutura dentro de `src/`:

```text
src/
├── api/           ← camada de dados: fala com o MockAPI (http.ts, notas.ts)
├── components/    ← UI reutilizável (NotaCartao, TemaToggle, estados, layout)
├── contexts/      ← TemaContext (único estado global que não vem do servidor)
├── hooks/         ← useApi, useDebounce, useLocalStorage
├── pages/         ← telas de rota (ListaNotas, EditorNota, Sobre, NaoEncontrado)
├── types/         ← tipos compartilhados (Nota)
├── App.tsx        ← rotas e providers no topo da árvore
├── main.tsx       ← bootstrap do React
└── vite-env.d.ts  ← tipagem das variáveis de ambiente
```

O ponto novo em relação ao curso é a pasta **`api/`**. Ela isola **toda** a comunicação
HTTP num só lugar. Nenhum componente chama `fetch` diretamente: eles chamam funções como
`listarNotas()` ou `criarNota()`. Assim, se um dia você trocar o MockAPI por outro backend
(ou voltar para `localStorage`), só essa pasta muda.

A divisão **`components/` vs. `pages/`** é a mesma convenção do curso: páginas são
componentes que **representam uma rota**; componentes são pedaços reutilizáveis usados
dentro das páginas.

```bash
# Crie as pastas de uma vez (a partir da raiz do projeto)
mkdir -p src/api src/components src/contexts src/hooks src/pages src/types
```

---

## 7. Passo 4 — Configurar o MockAPI.io

O MockAPI.io é um serviço que **gera uma API REST completa** a partir de um schema que você
desenha numa interface visual — sem escrever backend. Siga o
[Quick Start oficial](https://github.com/mockapi-io/docs/wiki/Quick-start-guide); os passos
abaixo são o resumo aplicado ao nosso recurso `notas`.

### 7.1. Criar conta e projeto

1. Acesse **[mockapi.io](https://mockapi.io)** e crie uma conta (login com Google/GitHub).
2. Clique em **New Project** (se já tiver algum projeto, exclua-o).

   - **Name:** `mini-notas`
   - **API Prefix:** deixe `/api/v1` (ou outro de sua preferência — você vai usar isso na URL).
3. Ao salvar, o MockAPI gera uma **URL base única**, algo como:

   ```text
   https://65f0a1b2c3d4e5f6a7b8c9d0.mockapi.io/api/v1
   ```

   Guarde essa URL — ela vai para o `.env` no próximo passo.

### 7.2. Criar o recurso `notas`

1. Dentro do projeto, clique em **New Resource**.
2. **Resource name:** `notas` (no plural — vira o caminho `/notas`).
3. Defina os campos (schema). Para cada campo você escolhe um gerador
   [Faker.js](https://fakerjs.dev) — isso serve **apenas para gerar dados de exemplo**:
   | Campo            | Tipo sugerido (Faker) | Observação    |
   | ---------------- | --------------------- | --------------- |
   | `titulo`       | `lorem.sentence`    | título da nota |
   | `conteudo`     | `lorem.paragraphs`  | corpo da nota   |
   | `criadaEm`     | `date.past`         | data ISO        |
   | `atualizadaEm` | `date.recent`       | data ISO        |
4. **E as `tags` (array)?** O MockAPI usa o schema só para **gerar** dados fake; quando o
   seu app envia um `POST`/`PUT`, **o MockAPI armazena exatamente o JSON que você mandar**,
   inclusive arrays. Ou seja: você **não precisa** declarar `tags` no schema — assim que o
   app criar uma nota com `tags: ["react", "estudos"]`, o campo passa a existir e a ser
   devolvido nas respostas. (Se quiser que os registros de exemplo já tenham tags, você
   pode adicionar o campo manualmente na UI.)
5. Depois de mandar criar, defina a quantidade de registros de exemplo (ex.: **25**).

O MockAPI agora expõe, automaticamente, estes endpoints:

| Método    | Endpoint       | Função             |
| ---------- | -------------- | -------------------- |
| `GET`    | `/notas`     | lista todas as notas |
| `GET`    | `/notas/:id` | uma nota específica |
| `POST`   | `/notas`     | cria uma nota        |
| `PUT`    | `/notas/:id` | atualiza uma nota    |
| `DELETE` | `/notas/:id` | exclui uma nota      |

### 7.3. Parâmetros de query que vamos usar

O MockAPI aceita parâmetros na URL da lista. Usaremos:

| Parâmetro             | Exemplo                                   | Efeito                                       |
| ---------------------- | ----------------------------------------- | -------------------------------------------- |
| `search`             | `/notas?search=react`                   | **busca full-text** em todos os campos |
| `sortBy` + `order` | `/notas?sortBy=atualizadaEm&order=desc` | ordenação                                  |
| `page` + `limit`   | `/notas?page=1&limit=10`                | paginação (opcional)                       |

> ⚠️ **Gotcha importante do MockAPI:** quando uma **lista filtrada não tem resultados**, o
> MockAPI responde **`404 Not Found`** (e não uma lista vazia `[]`). Vamos tratar isso na
> camada de dados, convertendo o 404 da *lista* em `[]`. Esse é um dos motivos de
> centralizar o `fetch` num só lugar.

### 7.4. Testar pelo terminal (opcional, mas recomendado)

```bash
# Troque pela SUA URL base
curl "https://SEU_TOKEN.mockapi.io/api/v1/notas"
```

Se você receber um JSON com os registros de exemplo, está tudo certo.

---

## 8. Passo 5 — Variável de ambiente (`VITE_API_URL`)

Nunca cole a URL do backend espalhada pelo código. O Vite expõe variáveis de ambiente que
começam com `VITE_` através de `import.meta.env`.

Crie um arquivo **`.env`** na **raiz** do projeto:

```bash
# .env  (troque pelo SEU token do MockAPI)
VITE_API_URL=https://SEU_TOKEN.mockapi.io/api/v1
```

Garanta que o `.env` **não vá para o Git** (ele pode conter URLs privadas). Confira o
`.gitignore` e adicione, se necessário:

```bash
# .gitignore
.env
.env.local
```

Crie também um **`.env.example`** (esse sim vai para o Git) servindo de modelo para quem
clonar o projeto:

```bash
# .env.example
VITE_API_URL=https://SEU_TOKEN.mockapi.io/api/v1
```

Para o TypeScript reconhecer a variável, edite **`src/vite-env.d.ts`**:

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

> ⚠️ Variáveis de ambiente são lidas **na inicialização do Vite**. Se você criar/editar o
> `.env` com o servidor rodando, **pare e rode `bun run dev` de novo**.

> ⚠️ **A `VITE_API_URL` vai só até o prefixo do projeto — NUNCA inclua `/notas`.** O recurso
> é adicionado pelo código (`const RECURSO = '/notas'`, no Passo 7.2). Se você colocar
> `.../api/v1/notas` na variável, as requisições viram `.../notas/notas` e você recebe
> **404** ao listar e **400** ao criar. Use `https://SEU_TOKEN.mockapi.io/api/v1` (ou apenas
> `https://SEU_TOKEN.mockapi.io` se criou o projeto **sem** prefixo de API).

---

## 9. Passo 6 — Tipos centrais

Crie **`src/types/Nota.ts`**:

```ts
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
```

Repare na diferença para o enunciado original: lá, o `id` era gerado no cliente com `crypto.randomUUID()`. Aqui, **quem cria o `id` é o servidor** — nós o recebemos de volta na resposta do `POST`. Por isso `NotaPayload` é a `Nota` **sem** o `id`.

---

## 10. Passo 7 — Camada de dados (a API)

Toda a conversa com o MockAPI mora em dois arquivos: um cliente HTTP genérico (`http.ts`) e as funções específicas do recurso `notas` (`notas.ts`).

### 10.1. Cliente HTTP genérico

Crie **`src/api/http.ts`**:

```ts
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
```

### 10.2. Funções do recurso `notas`

Crie **`src/api/notas.ts`**:

```ts
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
```

Note como os componentes nunca verão um `fetch`: eles importam `listarNotas`, `criarNota`,
etc. Essa é a fronteira limpa entre **"falar com o servidor"** e **"desenhar a tela"**.

---

## 11. Passo 8 — Custom hooks

Três hooks. Dois vêm direto do curso (`useLocalStorage`, `useDebounce`) e um é novo, criado
para o mundo assíncrono (`useApi`).

### 11.1. `useLocalStorage` (do M09)

Usado **só para o tema** agora. Crie **`src/hooks/useLocalStorage.ts`**:

```ts
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
```

### 11.2. `useDebounce` (do M09)

Adia a propagação de um valor até passar `ms` sem mudanças. Crie **`src/hooks/useDebounce.ts`**:

```ts
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
```

**Por que o debounce importa MAIS agora.** Com `localStorage`, filtrar a cada tecla era só gastar CPU à toa. Com a busca **no servidor**, cada tecla sem debounce seria **uma requisição HTTP**. O debounce espera o usuário parar de digitar (~400 ms) e dispara **uma** requisição. É a diferença entre 1 e 15 chamadas de rede ao digitar "componentes".

### 11.3. `useApi` (novo) — o coração do mundo assíncrono

Este hook generaliza o trio **carregando / erro / dados** e ainda **cancela** requisições obsoletas (essencial na busca, onde o termo muda rápido). Crie **`src/hooks/useApi.ts`**:

```ts
// src/hooks/useApi.ts
import { useState, useEffect, useCallback } from 'react';

type EstadoApi<T> = {
  dados: T | null;
  carregando: boolean;
  erro: string | null;
};

/**
 * Executa uma função assíncrona e expõe { dados, carregando, erro, recarregar }.
 * - Re-executa quando `deps` muda.
 * - Cancela a requisição anterior (AbortController) para evitar "race conditions".
 *
 * @param buscarDados recebe um AbortSignal; passe-o adiante para o fetch.
 * @param deps        lista de dependências (igual ao 2º argumento do useEffect).
 */
export function useApi<T>(
  buscarDados: (sinal: AbortSignal) => Promise<T>,
  deps: unknown[]
) {
  const [estado, setEstado] = useState<EstadoApi<T>>({
    dados: null,
    carregando: true,
    erro: null,
  });

  const [gatilho, setGatilho] = useState(0);
  const recarregar = useCallback(() => setGatilho((g) => g + 1), []);

  // "Congela" a função entre renders; só muda quando `deps` muda.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executar = useCallback(buscarDados, deps);

  useEffect(() => {
    const controlador = new AbortController();
    setEstado((s) => ({ ...s, carregando: true, erro: null }));

    executar(controlador.signal)
      .then((dados) => setEstado({ dados, carregando: false, erro: null }))
      .catch((e: unknown) => {
        if (controlador.signal.aborted) return; // requisição cancelada: ignore
        setEstado({ dados: null, carregando: false, erro: (e as Error).message });
      });

    return () => controlador.abort(); // cancela ao trocar deps / desmontar
  }, [executar, gatilho]);

  return { ...estado, recarregar };
}
```

Esse hook resume tudo o que o Módulo 12 ensinou sobre dados assíncronos, só que numa versão caseira (no espírito dos M06 + M09). Se um dia o app crescer, é exatamente esse hook que o **TanStack Query** (M12.4) substituiria com cache e dedup automáticos.

---

## 12. Passo 9 — Design system (componentes)

São cinco componentes reutilizáveis. Todos usam **classes do Bootstrap** no `className`.

### 12.1. `EstadoCarregando` — o spinner

Crie **`src/components/EstadoCarregando.tsx`**:

```tsx
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
```

### 12.2. `EstadoErro` — o alerta com "tentar de novo"

Crie **`src/components/EstadoErro.tsx`**:

```tsx
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
```

### 12.3. `NotaCartao` — o cartão da lista

Crie **`src/components/NotaCartao.tsx`**:

```tsx
// src/components/NotaCartao.tsx
import { Link } from 'react-router-dom';
import type { Nota } from '../types/Nota';

type Props = { nota: Nota };

export function NotaCartao({ nota }: Props) {
  const previa = nota.conteudo.slice(0, 120);
  const truncado = nota.conteudo.length > 120;
  const atualizada = new Date(nota.atualizadaEm).toLocaleDateString('pt-BR');

  return (
    <article className="card h-100 shadow-sm">
      <div className="card-body">
        <h3 className="card-title h5">
          <Link
            to={`/nota/${nota.id}`}
            className="stretched-link text-decoration-none"
          >
            {nota.titulo || '(sem título)'}
          </Link>
        </h3>
        <p className="card-text text-secondary mb-0">
          {previa}
          {truncado ? '…' : ''}
        </p>
      </div>

      <div className="card-footer bg-transparent d-flex flex-wrap align-items-center gap-2">
        <small className="text-secondary me-auto">atualizada em {atualizada}</small>
        {(nota.tags ?? []).map((t) => (
          <span key={t} className="badge text-bg-secondary">
            #{t}
          </span>
        ))}
      </div>
    </article>
  );
}
```

A classe `stretched-link` faz o **cartão inteiro** virar área clicável — um truque clássico
do Bootstrap para cards.

> ⚠️ **Por que `(nota.tags ?? [])` e não `nota.tags`?** Os registros de exemplo gerados pelo
> MockAPI **não têm** o campo `tags` (ele só passa a existir quando o app envia um `POST`/`PUT`
> com tags — veja o Passo 4.2). Logo, em notas de exemplo `nota.tags` é `undefined`, e
> `undefined.map(...)` quebraria a tela inteira. O `?? []` ("nullish coalescing") usa uma
> lista vazia quando `tags` está ausente, tornando o componente resiliente.

### 12.4. `TemaToggle` — o botão de tema

Crie **`src/components/TemaToggle.tsx`** (depende do `TemaContext` do Passo 11):

```tsx
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
```

### 12.5. `LayoutPrincipal` — header + conteúdo

Crie **`src/components/LayoutPrincipal.tsx`**:

```tsx
// src/components/LayoutPrincipal.tsx
import { NavLink, Outlet } from 'react-router-dom';
import { TemaToggle } from './TemaToggle';

export function LayoutPrincipal() {
  return (
    <>
      <nav className="navbar navbar-expand bg-body-tertiary border-bottom">
        <div className="container">
          <NavLink className="navbar-brand fw-bold" to="/">
            Mini Notas
          </NavLink>
          <div className="navbar-nav me-auto">
            <NavLink className="nav-link" to="/" end>
              Notas
            </NavLink>
            <NavLink className="nav-link" to="/sobre">
              Sobre
            </NavLink>
          </div>
          <TemaToggle />
        </div>
      </nav>

      <main className="container py-4">
        <Outlet />
      </main>
    </>
  );
}
```

As classes `bg-body-tertiary`, `text-secondary`, `border-bottom` etc. são **sensíveis ao
tema**: quando ativamos o `data-bs-theme="dark"`, o Bootstrap recalcula essas cores
sozinho. Por isso quase não escrevemos CSS próprio.

---

## 13. Passo 10 — Páginas

### 13.1. `ListaNotas` — lista + busca no servidor com debounce

Crie **`src/pages/ListaNotas.tsx`**:

```tsx
// src/pages/ListaNotas.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarNotas } from '../api/notas';
import { useApi } from '../hooks/useApi';
import { useDebounce } from '../hooks/useDebounce';
import { NotaCartao } from '../components/NotaCartao';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';

export function ListaNotas() {
  const [busca, setBusca] = useState('');
  const buscaAtrasada = useDebounce(busca, 400);

  // A cada novo termo (após debounce), o useApi dispara uma requisição
  // e CANCELA a anterior automaticamente.
  const { dados: notas, carregando, erro, recarregar } = useApi(
    (sinal) => listarNotas(buscaAtrasada, sinal),
    [buscaAtrasada]
  );

  return (
    <section>
      <div className="d-flex gap-2 mb-4">
        <input
          type="search"
          className="form-control"
          placeholder="Buscar notas..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Link to="/nova" className="btn btn-primary text-nowrap">
          + Nova nota
        </Link>
      </div>

      {carregando && <EstadoCarregando mensagem="Carregando notas..." />}

      {erro && <EstadoErro mensagem={erro} aoTentarDeNovo={recarregar} />}

      {!carregando && !erro && notas && notas.length === 0 && (
        <p className="text-secondary">Nenhuma nota encontrada.</p>
      )}

      {!carregando && !erro && notas && notas.length > 0 && (
        <div className="row g-3">
          {notas.map((n) => (
            <div className="col-12 col-sm-6 col-lg-4" key={n.id}>
              <NotaCartao nota={n} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
```

### 13.2. `EditorNota` — criar e editar (mesma tela)

A mesma página serve para criar (`/nova`, sem `id`) e editar (`/nota/:id`, com `id`). Crie
**`src/pages/EditorNota.tsx`**:

```tsx
// src/pages/EditorNota.tsx
import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  obterNota,
  criarNota,
  atualizarNota,
  excluirNota,
} from '../api/notas';
import { useApi } from '../hooks/useApi';
import { EstadoCarregando } from '../components/EstadoCarregando';
import { EstadoErro } from '../components/EstadoErro';
import type { NotaPayload } from '../types/Nota';

export function EditorNota() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const editando = Boolean(id);

  // Em modo edição, carrega a nota do servidor. Em modo criação, resolve com null.
  const { dados: nota, carregando, erro } = useApi(
    (sinal) => (id ? obterNota(id, sinal) : Promise.resolve(null)),
    [id]
  );

  // Estado do formulário (componentes controlados — M05).
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [tagsTexto, setTagsTexto] = useState('');

  // Estado das operações de escrita (salvar/excluir).
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  // Quando a nota chega do servidor, preenche o formulário.
  useEffect(() => {
    if (nota) {
      setTitulo(nota.titulo);
      setConteudo(nota.conteudo);
      setTagsTexto((nota.tags ?? []).join(', ')); // tags pode não existir em notas de exemplo
    }
  }, [nota]);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErroSalvar(null);

    const agora = new Date().toISOString();
    const tags = tagsTexto
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editando && id && nota) {
        const payload: NotaPayload = {
          titulo,
          conteudo,
          tags,
          criadaEm: nota.criadaEm, // preserva a data de criação original
          atualizadaEm: agora,
        };
        await atualizarNota(id, payload);
      } else {
        const payload: NotaPayload = {
          titulo,
          conteudo,
          tags,
          criadaEm: agora,
          atualizadaEm: agora,
        };
        await criarNota(payload);
      }
      navigate('/');
    } catch (err) {
      setErroSalvar((err as Error).message);
      setSalvando(false);
    }
  }

  async function remover() {
    if (!id) return;
    if (!confirm('Excluir esta nota? Esta ação não pode ser desfeita.')) return;

    setSalvando(true);
    setErroSalvar(null);
    try {
      await excluirNota(id);
      navigate('/');
    } catch (err) {
      setErroSalvar((err as Error).message);
      setSalvando(false);
    }
  }

  // Estados de carregamento/erro só importam no modo edição.
  if (editando && carregando) {
    return <EstadoCarregando mensagem="Carregando nota..." />;
  }
  if (editando && erro) {
    return <EstadoErro mensagem={erro} />;
  }

  return (
    <form onSubmit={salvar} className="vstack gap-3" style={{ maxWidth: 640 }}>
      <h2 className="h4">{editando ? 'Editar nota' : 'Nova nota'}</h2>

      <div>
        <label className="form-label">Título</label>
        <input
          className="form-control"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título da nota"
        />
      </div>

      <div>
        <label className="form-label">Conteúdo</label>
        <textarea
          className="form-control"
          rows={10}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Escreva sua nota..."
        />
      </div>

      <div>
        <label className="form-label">Tags (separadas por vírgula)</label>
        <input
          className="form-control"
          value={tagsTexto}
          onChange={(e) => setTagsTexto(e.target.value)}
          placeholder="react, estudos, importante"
        />
      </div>

      {erroSalvar && <EstadoErro mensagem={erroSalvar} />}

      <div className="d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Salvar' : 'Criar'}
        </button>
        {editando && (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={remover}
            disabled={salvando}
          >
            Excluir
          </button>
        )}
        <button
          type="button"
          className="btn btn-link"
          onClick={() => navigate('/')}
          disabled={salvando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
```

Pontos de atenção desta página:

- **`disabled={salvando}`** impede cliques duplos enquanto a requisição está no ar — um
  cuidado que não existia no mundo síncrono do `localStorage`.
- **`criadaEm` é preservado** na edição: lemos da nota carregada e só atualizamos
  `atualizadaEm`.
- O **`useEffect` que preenche o form** depende de `nota`: assim que o `GET` resolve, os
  campos aparecem prontos para editar.

### 13.3. `Sobre` e `NaoEncontrado`

Crie **`src/pages/Sobre.tsx`**:

```tsx
// src/pages/Sobre.tsx
export function Sobre() {
  return (
    <section>
      <h2 className="h4">Sobre o Mini Notas</h2>
      <p className="text-secondary">
        Projeto integrador do curso React Essencial. As notas são persistidas em uma API
        REST hospedada no MockAPI.io; a preferência de tema fica no navegador.
      </p>
    </section>
  );
}
```

Crie **`src/pages/NaoEncontrado.tsx`**:

```tsx
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
```

---

## 14. Passo 11 — Tema claro/escuro

O tema é o **único** estado global que não vem do servidor — então ele continua num Context
(como no curso), persistido em `localStorage`. A diferença é que agora aplicamos o tema via
`data-bs-theme`, o mecanismo nativo do Bootstrap 5.3.

Crie **`src/contexts/TemaContext.tsx`**:

```tsx
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
```

Trocar `document.body.classList` (curso) por `document.documentElement.setAttribute( 'data-bs-theme', ...)` é o que conecta o nosso toggle ao dark mode do Bootstrap. Nenhuma
linha de CSS de cor precisa ser escrita.

---

## 15. Passo 12 — App.tsx (rotas + providers)

Note que **não há mais `NotasProvider`**: as notas não vivem mais num estado global, e sim
são buscadas por página. Só o `TemaProvider` envolve a árvore.

Crie/edite **`src/App.tsx`**:

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TemaProvider } from './contexts/TemaContext';
import { LayoutPrincipal } from './components/LayoutPrincipal';
import { ListaNotas } from './pages/ListaNotas';
import { EditorNota } from './pages/EditorNota';
import { Sobre } from './pages/Sobre';
import { NaoEncontrado } from './pages/NaoEncontrado';

export default function App() {
  return (
    <TemaProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<LayoutPrincipal />}>
            <Route index element={<ListaNotas />} />
            <Route path="nova" element={<EditorNota />} />
            <Route path="nota/:id" element={<EditorNota />} />
            <Route path="sobre" element={<Sobre />} />
            <Route path="*" element={<NaoEncontrado />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TemaProvider>
  );
}
```

---

## 16. Passo 13 — main.tsx e limpeza

O `main.tsx` gerado pelo Vite já serve. Garanta que ele esteja assim (sem importar
`index.css`, já que o Bootstrap entra pelo `index.html`):

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

> Se você deixou um `import './index.css'` aqui, pode remover — ou manter um `index.css`
> vazio para customizações futuras. Lembre que, sob `StrictMode`, em desenvolvimento o React
> **monta os efeitos duas vezes**. Como nosso `useApi` cancela a requisição anterior, você
> pode ver uma requisição cancelada no DevTools — é esperado e inofensivo.

---

## 17. Passo 14 — Rodar e testar

```bash
bun run dev
# http://localhost:5173
```

Checklist de validação:

- [ ] A lista carrega (spinner some, cartões aparecem) — confirma o `GET /notas`.
- [ ] Digitar na busca filtra **após** ~400 ms; o termo vira `?search=` na aba **Network**.
- [ ] Buscar algo inexistente mostra "Nenhuma nota encontrada" (404 tratado como `[]`).
- [ ] "+ Nova nota" → preencher → "Criar" volta à lista com a nota nova (`POST`).
- [ ] Clicar num cartão abre o editor já preenchido (`GET /notas/:id`).
- [ ] Editar e "Salvar" reflete a mudança (`PUT`).
- [ ] "Excluir" remove a nota (`DELETE`).
- [ ] O toggle de tema alterna claro/escuro e **persiste** após recarregar a página.
- [ ] `bun run build` compila sem erros de TypeScript.

---

## 18. Solução de problemas (troubleshooting)

| Sintoma                                                                                     | Causa provável                                                                              | Solução                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `bun add` falha com `UNABLE_TO_VERIFY_LEAF_SIGNATURE`                                   | Proxy/antivírus da rede intercepta o HTTPS com um certificado que o Bun não conhece        | Rode a instalação uma vez com `$env:NODE_TLS_REJECT_UNAUTHORIZED="0"; bun add ...` (PowerShell) **só para destravar**; a solução definitiva é apontar `NODE_EXTRA_CA_CERTS` para o `.crt` raiz do proxy/antivírus |
| `Cannot read properties of null (reading 'useRef')` / "Invalid hook call" no react-router | `react-router-dom` não instalado (o `bun add` do Passo 1 falhou) + cache antigo do Vite | Instale `react-router-dom`, apague `node_modules/.vite` e rode `bun run dev` de novo                                                                                                                                           |
| Requisições vão para `.../notas/notas` (404 ao listar, 400 ao criar)                   | `VITE_API_URL` inclui `/notas` no final                                                  | Tire o `/notas` da variável — ela vai só até o prefixo do projeto (Passo 5)                                                                                                                                                    |
| App quebra com "VITE_API_URL não definida"                                                 | `.env` ausente ou servidor iniciado antes do `.env`                                      | Crie o `.env` e **reinicie** `bun run dev`                                                                                                                                                                                 |
| Lista sempre vazia, mesmo com dados                                                         | URL base errada ou recurso com outro nome                                                    | Confira `VITE_API_URL` e se o recurso é `notas` (plural)                                                                                                                                                                        |
| Busca sem resultado dá erro vermelho                                                       | 404 da lista não tratado                                                                    | Confirme o `try/catch` em `listarNotas` (Passo 10.2)                                                                                                                                                                             |
| Erro de**CORS** no console                                                            | URL com `http://` ou domínio errado                                                       | Use o domínio `https://...mockapi.io` exato do projeto                                                                                                                                                                            |
| `Cannot read properties of undefined (reading 'map')` em `NotaCartao`                   | registros de exemplo do MockAPI sem o campo `tags`                                         | Já tratado com `(nota.tags ?? [])` nos Passos 9.3 e 10.2; ou adicione `tags` no schema do MockAPI                                                                                                                               |
| Mudei o `.env` e nada mudou                                                               | Vite lê env só na inicialização                                                          | Pare e rode `bun run dev` de novo                                                                                                                                                                                                  |
| Duas requisições ao abrir a tela                                                          | `StrictMode` em dev monta efeitos 2x                                                       | Comportamento esperado; some no build de produção                                                                                                                                                                                  |

---

## 19. Desafios / extensões

Com a base remota pronta, estas extensões ensinam padrões que só fazem sentido **com um
backend**:

1. **Atualização otimista (M12.3 — `useOptimistic`).** Ao excluir, remova o cartão da tela
   **antes** da confirmação do servidor e faça rollback se o `DELETE` falhar.
2. **Paginação.** Use `?page=&limit=` do MockAPI e um botão "carregar mais" no fim da lista.
3. **Ordenação configurável.** Um `<select>` (Mais recentes / Mais antigas / A–Z) que muda
   `sortBy` e `order` — busca no servidor, não em memória.
4. **TanStack Query (M12.4).** Substitua o `useApi` por `useQuery`/`useMutation` e ganhe
   cache, dedup e `refetch on focus` de graça.
5. **Confirmação com modal do Bootstrap** em vez de `confirm()` nativo, usando o JS bundle.
6. **Feedback de sucesso** com um *toast* do Bootstrap após criar/editar/excluir.

> Para cada extensão, pergunte-se: **onde mora o estado? qual requisição muda? qual
> componente é afetado?** Sentir esse diálogo entre feature e arquitetura é o objetivo do
> projeto integrador.

---

## 20. Atividade final (pratique sem código pronto)

Agora é a sua vez. Diferente do restante do tutorial, **aqui não há código pronto** — só o
objetivo, algumas dicas e os critérios de aceitação. Tudo o que você precisa já apareceu nos
passos anteriores; use o código existente como referência.

Implemente as **quatro** melhorias abaixo. Elas são pequenas e independentes, então faça uma
de cada vez. Para cada uma, antes de escrever qualquer linha, responda às três perguntas que
guiaram o projeto inteiro: **onde mora o estado? qual requisição muda (se alguma)? qual
componente é afetado?**

### 20.1. Validação do formulário (título obrigatório)

**Objetivo:** impedir salvar uma nota sem título, no `EditorNota`.

Dicas:

- O botão de salvar já tem `disabled={salvando}`; combine isso com uma condição de título
  vazio.
- `titulo.trim().length === 0` indica título "em branco" (só espaços não valem).
- Mostre uma mensagem de ajuda abaixo do campo usando classes do Bootstrap (ex.: `text-danger`).

Critérios de aceitação:

- [ ] Com o campo Título vazio (ou só espaços), o botão **Criar/Salvar** fica desabilitado.
- [ ] Aparece uma mensagem indicando que o título é obrigatório.
- [ ] Ao digitar um título válido, o botão habilita e a mensagem some.

### 20.2. Contador de notas

**Objetivo:** mostrar quantas notas estão na lista atual (ex.: "12 notas"), no topo do
`ListaNotas`, atualizando conforme a busca filtra.

Dicas:

- O array `notas` já tem o tamanho que você precisa (`notas.length`).
- Cuide do singular/plural ("1 nota" vs. "3 notas").
- Não mostre o contador enquanto `carregando` for `true` nem quando houver `erro`.

Critérios de aceitação:

- [ ] O número exibido bate com a quantidade de cartões na tela.
- [ ] O texto respeita singular/plural.
- [ ] Nenhuma requisição **nova** foi criada para isso (é estado derivado).

### 20.3. Botão "limpar busca"

**Objetivo:** adicionar um botão **✕** que esvazia o campo de busca e volta à lista completa,
aparecendo **somente** quando há texto digitado.

Dicas:

- O input já é controlado por `busca` / `setBusca`. Limpar é `setBusca('')`.
- A lista recarrega sozinha depois disso — graças ao `useApi` + `useDebounce`. Você **não**
  precisa chamar a API na mão.
- Use renderização condicional para exibir o ✕ apenas quando `busca` não estiver vazio.

Critérios de aceitação:

- [ ] O ✕ só aparece quando há algo digitado na busca.
- [ ] Clicar nele limpa o campo e a lista volta a mostrar todas as notas.
- [ ] Você não escreveu nenhuma chamada manual a `listarNotas` para isso.

### 20.4. Filtro por tag clicável

**Objetivo:** clicar numa tag (ex.: `#react`) no `NotaCartao` deve filtrar a lista por aquela
tag, reaproveitando a **busca no servidor** (`?search=`) que já existe.

Esta é a mais difícil das quatro — ela toca em mais de um componente. Pense com calma nas
três perguntas-guia antes de começar.

Dicas:

- A busca no servidor já filtra por texto; passar o nome da tag como termo de busca é um bom
  ponto de partida.
- O estado `busca` mora no `ListaNotas`, mas o clique acontece no `NotaCartao`. Pense em como
  a informação da tag clicada chega até lá (uma **prop de callback** é uma opção; navegar com
  a tag na URL é outra).
- Atenção ao conflito de cliques: a tag fica dentro do cartão, que tem um `stretched-link`
  cobrindo a área inteira. Você vai precisar garantir que o clique na tag não seja
  "engolido" pelo link do cartão.

Critérios de aceitação:

- [ ] Clicar numa tag filtra a lista para mostrar apenas notas com aquele termo.
- [ ] O campo de busca reflete o filtro aplicado (fica coerente com o que está na tela).
- [ ] Clicar na tag **não** abre o editor da nota por engano.

> **Como entregar.** Faça as quatro melhorias funcionarem juntas e rode `bun run build` para garantir que compila sem erros de TypeScript. Se travar, releia o passo correspondente do tutorial: as ferramentas para resolver cada item já estão todas lá.

> **QUANDO CONCLUIR**, submeta ao GitHub como um repositório público e envie o link do repositório na atividade disponível no AVA.

---

**Pronto.** Você tem um app React completo, com persistência em uma API REST real,
estados de carregamento e erro tratados, busca no servidor com debounce, tema persistente e
um design system baseado em Bootstrap — sem escrever uma linha de backend.
