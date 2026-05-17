# PALANTIR — Mapa do Realm

> Consulte este arquivo antes de ler qualquer source. Se o dado está aqui, não leia o arquivo cru.

Atualizado em: 2026-05-11

---

## Visão Geral

**Projeto:** Pokedex  
**Tipo:** Monorepo (npm workspaces)  
**Apps:** `apps/api` (NestJS + Prisma) · `apps/web` (Next.js 15 + React 19)  
**DB:** PostgreSQL via Prisma ORM  
**Auth:** JWT via Bearer token (passport-jwt)  
**Fonte de dados Pokémon:** PokeAPI `https://pokeapi.co/api/v2` — consumida pelo backend

---

## Estrutura do Realm

```
Pokedex/
├── apps/
│   ├── api/               # NestJS REST API (porta 3001)
│   └── web/               # Next.js frontend (porta 3000)
├── docs/
│   ├── archive/
│   │   ├── PALANTIR.md    # Este arquivo
│   │   └── RED_BOOK.md    # Lições aprendidas / anti-padrões
│   └── contexto.md        # Contexto da quest ativa
├── QUEST_PROGRESS.md      # Log de execução de quests
└── CLAUDE.md              # Mandatos do orquestrador
```

---

## Variáveis de Ambiente

### API (`apps/api/.env`)

| Var | Padrão | Observação |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/pokedex` | Prisma |
| `JWT_SECRET` | `change-me` | ⚠️ Shadow — ver seção de Shadows |
| `PORT` | `3001` | Porta HTTP |
| `FRONTEND_URL` | `http://localhost:3000` | CORS origin |

### Web (`apps/web/.env`)

| Var | Padrão | Observação |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL para `src/lib/api.ts` |

---

## API — apps/api

### Pilares (arquivos críticos)

| Arquivo | Papel | Risco |
|---|---|---|
| `src/app.module.ts` | Root module — registra todos os módulos | Alto — mudança cascateia |
| `src/main.ts` | Bootstrap, CORS, GlobalPipes | Médio |
| `src/database/prisma.service.ts` | Singleton Prisma | Alto — Citadel Pillar |
| `prisma/schema.prisma` | Schema DB | Alto — migrations irreversíveis |

### Rotas da API

| Método | Rota | Auth | Handler | Retorno |
|---|---|---|---|---|
| POST | `/auth/register` | — | `AuthController.register` | `AuthResponse` |
| POST | `/auth/login` | — | `AuthController.login` | `AuthResponse` |
| GET | `/pokemon?search=&limit=` | — | `PokemonController.search` | `{ total, items: PokemonSummary[] }` |
| GET | `/pokemon/:nameOrId` | — | `PokemonController.getById` | `PokemonSummary` |
| GET | `/collection` | JWT | `UserPokemonController.list` | `CollectionEntry[]` |
| POST | `/collection` | JWT | `UserPokemonController.create` | `CollectionEntry` |
| PATCH | `/collection/:id` | JWT | `UserPokemonController.update` | `CollectionEntry` |
| DELETE | `/collection/:id` | JWT | `UserPokemonController.remove` | `{ success: true }` |

### Comportamentos importantes

**Auth (`auth.service.ts`):**
- `register`: hash bcrypt (rounds=10) → cria user → emite JWT
- `login`: busca por email → compara bcrypt → emite JWT
- JWT payload: `{ sub: userId, email, name }`
- Resposta auth: `{ accessToken, user: { id, name, email } }`

**Pokemon (`pokemon.service.ts`):**
- `search()`: busca somente os **primeiros 151 Pokémon** (Gen 1, hardcoded `limit=151&offset=0`)
- Limite de resposta: 1–50 (default 12)
- Resposta por Pokémon: `{ id, name, spriteUrl, shinySpriteUrl, artworkUrl, types[] }`

**UserPokemon (`user-pokemon.service.ts`):**
- `create`: verifica duplicata antes de inserir → `ConflictException` (409) se já existe
- `update/delete`: `ensureOwnership` → `NotFoundException` (404) se não é dono (não usa 403 — intencional)
- `list`: ordenado por `pokemonName ASC`

### Módulos

| Módulo | Controller | Service | Responsabilidade |
|---|---|---|---|
| `auth` | `auth.controller.ts` | `auth.service.ts` | Register/Login, emissão JWT |
| `pokemon` | `pokemon.controller.ts` | `pokemon.service.ts` | Proxy PokeAPI |
| `user-pokemon` | `user-pokemon.controller.ts` | `user-pokemon.service.ts` | Coleção do usuário |
| `users` | — | `users.service.ts` | CRUD de usuários (sem controller direto) |
| `database` | — | `prisma.service.ts` | Abstração DB |

### DTOs

| DTO | Validações chave |
|---|---|
| `LoginDto` | `email` (IsEmail) · `password` (MinLength 6) |
| `RegisterDto` | `name` (MinLength 2) · `email` (IsEmail) · `password` (MinLength 6) |
| `CreateUserPokemonDto` | `pokeApiId` (Int, Min 1) · `pokemonName` · `isShiny` (bool) · `gender` (enum) · `note?` (MaxLength 280) |
| `UpdateUserPokemonDto` | `isShiny?` · `gender?` · `note?` (MaxLength 280) — todos opcionais |

### Schema Prisma

**User**  
`id (cuid) · name · email (unique) · passwordHash · createdAt · updatedAt · collection[]`

**UserPokemon**  
`id (cuid) · userId · pokeApiId (Int) · pokemonName · spriteUrl? · isShiny (bool) · gender (PokemonGender) · note? · createdAt · updatedAt`  
`@@unique([userId, pokeApiId])` · `@@index([userId])`

**PokemonGender enum:** `male | female | unknown`  
Definido também em `src/user-pokemon/pokemon-gender.ts` como `pokemonGenderValues` (const array + type).

---

## Web — apps/web

### Rotas (App Router)

| Rota | Arquivo | Observação |
|---|---|---|
| `/` | `src/app/page.tsx` | Página raiz |
| `/login` | `src/app/login/page.tsx` | Renderiza `AuthForm mode="login"` |
| `/register` | `src/app/register/page.tsx` | Renderiza `AuthForm mode="register"` |
| `/pokedex` | `src/app/pokedex/page.tsx` | App principal — search + coleção |
| `/collection` | `src/app/collection/page.tsx` | Página stub — redireciona para `/pokedex` |

### Componentes

| Componente | Responsabilidade |
|---|---|
| `src/components/auth-form.tsx` | Form login/register (prop `mode`) |
| `src/components/pokedex-client.tsx` | Client component — search, toggle coleção, edição inline |

**PokedexClient — comportamentos:**
- `useEffect` inicial: lê `localStorage.getItem('pokedex.auth')` → se ausente, redireciona `/login`
- Search: debounced 250ms, valor inicial padrão `'pik'`
- Toggle coleção: se já tem → DELETE; se não tem → POST com `isShiny: false, gender: 'unknown'`
- Atualização inline: `PATCH` imediato no blur (note) ou onChange (shiny/gender) → reload da coleção

### Auth no cliente

**Storage:** `localStorage`, chave `pokedex.auth`, valor: `AuthResponse` JSON completo  
**Leitura:** `PokedexClient` lê no mount; `AuthForm` escreve após login/register bem-sucedido

### Lib

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/api.ts` | Fetch wrappers — todos com `cache: 'no-store'`, erro extraído de `body.message` |
| `src/lib/types.ts` | `AuthResponse` · `PokemonSummary` · `CollectionEntry` |

### Tipos Frontend

```ts
AuthResponse    = { accessToken: string; user: { id, name, email } }
PokemonSummary  = { id, name, spriteUrl, shinySpriteUrl, artworkUrl, types[] }
CollectionEntry = { id, userId, pokeApiId, pokemonName, spriteUrl?, isShiny, gender, note?, createdAt, updatedAt }
```

---

## Contrato API ↔ Web

| Operação | Web chama | API retorna |
|---|---|---|
| Login/Register | `POST /auth/*` | `AuthResponse` → salvo em `localStorage.pokedex.auth` |
| Buscar Pokémon | `GET /pokemon?search=&limit=12` | `{ total, items: PokemonSummary[] }` |
| Listar coleção | `GET /collection` (Bearer) | `CollectionEntry[]` |
| Adicionar | `POST /collection` (Bearer) | `CollectionEntry` |
| Editar | `PATCH /collection/:id` (Bearer) | `CollectionEntry` |
| Remover | `DELETE /collection/:id` (Bearer) | `{ success: true }` |

---

## Arquitetura BFF (desde 2026-05-11)

O frontend **nunca fala diretamente com o NestJS** para rotas autenticadas.
O token JWT vive em cookie `httpOnly` gerenciado pelo Next.js.

```
Browser → Next.js API routes (/api/*) → NestJS API
                 ↑
         lê cookie pokedex_token (httpOnly)
         passa como Bearer para NestJS
```

| Rota Next.js | Chama NestJS | Observação |
|---|---|---|
| `POST /api/auth/login` | `POST /auth/login` | Seta cookie `pokedex_token` |
| `POST /api/auth/register` | `POST /auth/register` | Seta cookie `pokedex_token` |
| `POST /api/auth/logout` | — | Limpa cookie |
| `GET /api/collection` | `GET /collection` | Lê cookie, passa Bearer |
| `POST /api/collection` | `POST /collection` | Lê cookie, passa Bearer |
| `PATCH /api/collection/[id]` | `PATCH /collection/:id` | Lê cookie, passa Bearer |
| `DELETE /api/collection/[id]` | `DELETE /collection/:id` | Lê cookie, passa Bearer |

**Cookie:** `pokedex_token` — httpOnly, Secure (produção), SameSite=strict, 7 dias  
**Helper server-side:** `src/lib/nest-client.ts` — `getAuthToken()`, `nestFetch()`, `COOKIE_OPTS`  
**Auth gate:** `apps/web/src/app/pokedex/page.tsx` (server component) — redireciona para `/login` se cookie ausente

---

## Shadows Conhecidos

| # | Shadow | Severidade | Status |
|---|---|---|---|
| 1 | `JWT_SECRET` sem validação | Alta | ✅ Resolvido — fail-fast no boot |
| 2 | Token em `localStorage` (XSS) | Alta | ✅ Resolvido — httpOnly cookie via BFF |
| 3 | `ensureOwnership` retornava 404 para 403 | Baixa | ✅ Resolvido — 404 para não encontrado, 403 para acesso negado |
| 4 | PokeAPI limitada a Gen 1 (151) — hardcoded | Baixa | Aberto |
| 5 | `/collection` page é stub — redireciona para `/pokedex` | Baixa | Aberto |
| 6 | Sem testes automatizados | Alta | ✅ Parcialmente resolvido — 15 testes unitários em `auth.service` e `user-pokemon.service` |

---

## Atualização

Atualize este arquivo após qualquer mudança estrutural (novo módulo, novo modelo, nova rota, nova env var).
