# PALANTIR — Mapa do Realm

> Consulte este arquivo antes de ler qualquer source. Se o dado está aqui, não leia o arquivo cru.

Gerado em: 2026-05-11

---

## Visão Geral

**Projeto:** Pokedex  
**Tipo:** Monorepo (npm workspaces)  
**Apps:** `apps/api` (NestJS + Prisma) · `apps/web` (Next.js 15 + React 19)  
**DB:** PostgreSQL via Prisma ORM  
**Auth:** JWT (passport-jwt)

---

## Estrutura do Realm

```
Pokedex/
├── apps/
│   ├── api/               # NestJS REST API
│   └── web/               # Next.js frontend
├── docs/
│   ├── archive/
│   │   ├── PALANTIR.md    # Este arquivo — mapa do realm
│   │   └── RED_BOOK.md    # Lições aprendidas / anti-padrões
│   └── contexto.md        # Contexto da quest ativa
├── QUEST_PROGRESS.md      # Log de execução de quests
└── CLAUDE.md              # Mandatos do orquestrador
```

---

## API — apps/api

### Pilares (arquivos críticos)

| Arquivo | Papel | Risco |
|---|---|---|
| `src/app.module.ts` | Root module — registra todos os módulos | Alto — qualquer mudança cascateia |
| `src/main.ts` | Bootstrap + CORS config | Médio |
| `src/database/prisma.service.ts` | Singleton Prisma | Alto — Citadel Pillar |
| `prisma/schema.prisma` | Schema DB — User + UserPokemon | Alto — migrations são irreversíveis |

### Módulos

| Módulo | Controller | Service | Responsabilidade |
|---|---|---|---|
| `auth` | `auth.controller.ts` | `auth.service.ts` | Register/Login, emissão JWT |
| `pokemon` | `pokemon.controller.ts` | `pokemon.service.ts` | Dados de Pokémon (via PokeAPI) |
| `user-pokemon` | `user-pokemon.controller.ts` | `user-pokemon.service.ts` | Coleção do usuário |
| `users` | — | `users.service.ts` | CRUD de usuários |
| `database` | — | `prisma.service.ts` | Abstração DB |

### Dependências chave

- `@nestjs/jwt` + `passport-jwt` — autenticação
- `bcrypt` — hash de senha
- `class-validator` + `class-transformer` — validação DTOs
- `@prisma/client` v5 — acesso ao banco

### DTOs

| DTO | Localização |
|---|---|
| `LoginDto` | `src/auth/dto/login.dto.ts` |
| `RegisterDto` | `src/auth/dto/register.dto.ts` |
| `CreateUserPokemonDto` | `src/user-pokemon/dto/create-user-pokemon.dto.ts` |
| `UpdateUserPokemonDto` | `src/user-pokemon/dto/update-user-pokemon.dto.ts` |

### Schema Prisma

**User**  
`id (cuid) · name · email (unique) · passwordHash · createdAt · updatedAt · collection[]`

**UserPokemon**  
`id (cuid) · userId · pokeApiId (Int) · pokemonName · spriteUrl? · isShiny (bool) · gender (enum) · note? · createdAt · updatedAt`  
Constraint: `@@unique([userId, pokeApiId])` — um usuário não pode capturar o mesmo Pokémon duas vezes.

**PokemonGender enum:** `male | female | unknown`

---

## Web — apps/web

### Rotas (App Router)

| Rota | Arquivo | Função |
|---|---|---|
| `/` | `src/app/page.tsx` | Página raiz |
| `/login` | `src/app/login/page.tsx` | Autenticação |
| `/register` | `src/app/register/page.tsx` | Cadastro |
| `/pokedex` | `src/app/pokedex/page.tsx` | Listagem de Pokémons |
| `/collection` | `src/app/collection/page.tsx` | Coleção do usuário logado |

### Componentes

| Componente | Responsabilidade |
|---|---|
| `src/components/auth-form.tsx` | Form reutilizável login/register |
| `src/components/pokedex-client.tsx` | Client component da Pokédex |

### Lib

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/api.ts` | Funções de acesso à API (fetch wrappers) |
| `src/lib/types.ts` | Tipos TypeScript compartilhados |

### Dependências chave

- `next` v15 · `react` v19 — stack base
- Sem biblioteca de UI externa ainda (vanilla)
- Sem estado global (sem Redux/Zustand) ainda

---

## Contratos de Interface (API ↔ Web)

- Auth retorna JWT — armazenamento no cliente não documentado ainda
- PokeAPI é consumida pelo backend (`pokemon.service.ts`), não direto do frontend

---

## Shadows Conhecidos

1. `@@unique([userId, pokeApiId])` — tentativa de capturar Pokémon já na coleção causa erro 500 se não tratado
2. CORS não documentado — verificar `main.ts` antes de deploy
3. Sem testes automatizados — toda mudança é manual

---

## Atualização

Atualize este arquivo após qualquer mudança estrutural (novo módulo, novo modelo, nova rota).
