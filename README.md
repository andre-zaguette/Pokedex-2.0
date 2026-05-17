# Pokedex Monorepo

Monorepo com:

- `apps/api`: backend em NestJS com autenticação JWT, Postgres e integração com a PokeAPI
- `apps/web`: frontend em Next.js que consome o backend

## Requisitos

- Node.js 20+
- npm 10+
- Postgres 15+

## Estrutura

```text
apps/
  api/  -> NestJS + Prisma + JWT
  web/  -> Next.js App Router
```

## Fluxo principal

1. Usuário se cadastra ou faz login.
2. O frontend salva o token JWT no navegador.
3. O usuário pesquisa pokemons.
4. O backend consulta a PokeAPI e normaliza os dados.
5. O usuário marca quais pokemons possui, incluindo:
   - se é shiny
   - gênero (`male`, `female`, `unknown`)
   - observação opcional

## Banco de dados

As entidades principais são:

- `User`
- `UserPokemon`

`UserPokemon` guarda o vínculo entre o usuário e o pokemon identificado pelo `pokeApiId`.

## Variáveis de ambiente

### Backend

Copie `apps/api/.env.example` para `apps/api/.env`.

### Frontend

Copie `apps/web/.env.example` para `apps/web/.env.local`.

## Scripts

Na raiz:

```bash
npm install
npm run dev:api
npm run dev:web
```

No backend, depois de configurar o banco:

```bash
npm run prisma:generate --workspace api
npm run prisma:migrate --workspace api
```

## Endpoints principais

- `POST /auth/register`
- `POST /auth/login`
- `GET /pokemon?search=pika&limit=12`
- `GET /pokemon/:id`
- `GET /collection`
- `POST /collection`
- `PATCH /collection/:id`
- `DELETE /collection/:id`
