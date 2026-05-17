import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

const mockUser = {
  id: 'u1',
  name: 'Ash',
  email: 'ash@pokemon.com',
  passwordHash: 'hashed_password',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'create' | 'findByEmail'>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
  });

  describe('register', () => {
    it('creates user and returns access token with user info', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        name: 'Ash',
        email: 'ash@pokemon.com',
        password: 'pikachu123',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ash@pokemon.com', name: 'Ash' }),
      );
      expect(result).toEqual({
        accessToken: 'mock.jwt.token',
        user: { id: 'u1', name: 'Ash', email: 'ash@pokemon.com' },
      });
    });

    it('hashes the password before storing', async () => {
      usersService.create.mockResolvedValue(mockUser);

      await service.register({ name: 'Ash', email: 'ash@pokemon.com', password: 'pikachu123' });

      const callArg = usersService.create.mock.calls[0][0];
      expect(callArg.passwordHash).not.toBe('pikachu123');
    });
  });

  describe('login', () => {
    it('returns access token for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login({ email: 'ash@pokemon.com', password: 'pikachu123' });

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user).toEqual({ id: 'u1', name: 'Ash', email: 'ash@pokemon.com' });
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'ghost@pokemon.com', password: 'pikachu123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(
        service.login({ email: 'ash@pokemon.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('does not distinguish between wrong email and wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const error1 = await service.login({ email: 'ghost@pokemon.com', password: 'x' }).catch((e) => e);

      usersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      const error2 = await service.login({ email: 'ash@pokemon.com', password: 'wrong' }).catch((e) => e);

      expect(error1.message).toBe(error2.message);
    });
  });
});
