-- CreateEnum
CREATE TYPE "PokemonGender" AS ENUM ('male', 'female', 'unknown');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPokemon" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "pokeApiId" INTEGER NOT NULL,
    "pokemonName" TEXT NOT NULL,
    "spriteUrl" TEXT,
    "isShiny" BOOLEAN NOT NULL DEFAULT false,
    "gender" "PokemonGender" NOT NULL DEFAULT 'unknown',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPokemon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "UserPokemon_userId_idx" ON "UserPokemon"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPokemon_userId_pokeApiId_key" ON "UserPokemon"("userId", "pokeApiId");

-- AddForeignKey
ALTER TABLE "UserPokemon" ADD CONSTRAINT "UserPokemon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
