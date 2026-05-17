import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { UserPokemonService } from './user-pokemon.service';

const mockItem = {
  id: 'item1',
  userId: 'u1',
  pokeApiId: 25,
  pokemonName: 'pikachu',
  spriteUrl: null,
  isShiny: false,
  gender: 'unknown' as const,
  note: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createInput = {
  pokeApiId: 25,
  pokemonName: 'pikachu',
  isShiny: false,
  gender: 'unknown' as const,
};

describe('UserPokemonService', () => {
  let service: UserPokemonService;
  let prismaUserPokemon: Record<string, jest.Mock>;

  beforeEach(async () => {
    prismaUserPokemon = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserPokemonService,
        {
          provide: PrismaService,
          useValue: { userPokemon: prismaUserPokemon },
        },
      ],
    }).compile();

    service = module.get<UserPokemonService>(UserPokemonService);
  });

  describe('list', () => {
    it('returns items for user ordered by name', async () => {
      prismaUserPokemon.findMany.mockResolvedValue([mockItem]);

      const result = await service.list('u1');

      expect(result).toEqual([mockItem]);
      expect(prismaUserPokemon.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'u1' } }),
      );
    });
  });

  describe('create', () => {
    it('creates and returns new collection item', async () => {
      prismaUserPokemon.findUnique.mockResolvedValue(null);
      prismaUserPokemon.create.mockResolvedValue(mockItem);

      const result = await service.create('u1', createInput);

      expect(result).toEqual(mockItem);
      expect(prismaUserPokemon.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u1', pokeApiId: 25 }) }),
      );
    });

    it('throws ConflictException when pokemon already in collection', async () => {
      prismaUserPokemon.findUnique.mockResolvedValue(mockItem);

      await expect(service.create('u1', createInput)).rejects.toThrow(ConflictException);
      expect(prismaUserPokemon.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates item when user is owner', async () => {
      const updated = { ...mockItem, isShiny: true };
      prismaUserPokemon.findUnique.mockResolvedValue(mockItem);
      prismaUserPokemon.update.mockResolvedValue(updated);

      const result = await service.update('u1', 'item1', { isShiny: true });

      expect(result.isShiny).toBe(true);
    });

    it('throws NotFoundException when item does not exist', async () => {
      prismaUserPokemon.findUnique.mockResolvedValue(null);

      await expect(service.update('u1', 'ghost', { isShiny: true })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when user is not the owner', async () => {
      prismaUserPokemon.findUnique.mockResolvedValue({ ...mockItem, userId: 'other' });

      await expect(service.update('u1', 'item1', { isShiny: true })).rejects.toThrow(
        ForbiddenException,
      );
      expect(prismaUserPokemon.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes item and returns success', async () => {
      prismaUserPokemon.findUnique.mockResolvedValue(mockItem);
      prismaUserPokemon.delete.mockResolvedValue(mockItem);

      const result = await service.remove('u1', 'item1');

      expect(result).toEqual({ success: true });
      expect(prismaUserPokemon.delete).toHaveBeenCalledWith({ where: { id: 'item1' } });
    });

    it('throws NotFoundException when item does not exist', async () => {
      prismaUserPokemon.findUnique.mockResolvedValue(null);

      await expect(service.remove('u1', 'ghost')).rejects.toThrow(NotFoundException);
      expect(prismaUserPokemon.delete).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException when user is not the owner', async () => {
      prismaUserPokemon.findUnique.mockResolvedValue({ ...mockItem, userId: 'other' });

      await expect(service.remove('u1', 'item1')).rejects.toThrow(ForbiddenException);
      expect(prismaUserPokemon.delete).not.toHaveBeenCalled();
    });
  });
});
