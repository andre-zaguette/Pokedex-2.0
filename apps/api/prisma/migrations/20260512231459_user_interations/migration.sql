-- CreateEnum
CREATE TYPE "PokemonStatus" AS ENUM ('seen', 'caught');

-- AlterTable
ALTER TABLE "UserPokemon" ADD COLUMN     "status" "PokemonStatus" NOT NULL DEFAULT 'seen';
