# Pokedex Web (Frontend)

Frontend da Pokedex construído com Next.js (App Router), TypeScript e Framer Motion.

Este repositório contém apenas a aplicação frontend. O backend (API) está localizado em um repositório separado.

## Requisitos

- Node.js 20+
- npm 10+

## Começando

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   - Copie `.env.example` para `.env.local` e ajuste a URL da API se necessário.

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Funcionalidades

- Listagem de Pokemons com busca.
- Detalhes do Pokemon.
- Gerenciamento de Coleção (possuídos, shiny, gênero).
- Autenticação de usuário.

## Tecnologias

- Next.js 15
- React 19
- Framer Motion (animações)
- Tailwind CSS (via globals.css)
- Jest / React Testing Library (testes)
