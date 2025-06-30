import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { Prisma, User, UserType, Country, Prefix, Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedpassword',
    type: UserType.PARTICULIER,
    firstName: 'John',
    lastName: 'Doe',
    country: Country.Kuwait,
    prefix: Prefix.PLUS_965,
    phoneNumber: 12345678,
    verify_token: null,
    verified_email: false,
    reset_token: null,
    reset_token_expiry: null,
    role: Role.USER,
    refresh_token: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCreateUserDto: CreateUserDto = {
    email: 'test@example.com',
    password: 'password123',
    type: UserType.PARTICULIER,
    firstName: 'John',
    lastName: 'Doe',
    country: Country.Kuwait,
    prefix: Prefix.PLUS_965,
    phoneNumber: 12345678,
    verify_token: null,
    verified_email: false,
  };

  const mockUpdateUserDto: UpdateUserDto = {
    email: 'updated@example.com',
    password: 'newpassword123',
    type: UserType.ENTREPRISE,
    firstName: 'Jane',
    lastName: 'Smith',
    country: Country.UAE,
    prefix: Prefix.PLUS_971,
    phoneNumber: 87654321,
    verify_token: null,
    verified_email: true,
    reset_token: null,
    reset_token_expiry: null,
  };

  const mockUsersRepository = {
    createUser: jest.fn(),
    findUserById: jest.fn(),
    findUserByEmail: jest.fn(),
    updateUser: jest.fn(),
    findUserByRefreshToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      mockUsersRepository.createUser.mockResolvedValue(mockUser);

      const result = await service.createUser(mockCreateUserDto);

      expect(repository.createUser).toHaveBeenCalledWith(mockCreateUserDto);
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException when email already exists', async () => {
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed',
        { code: 'P2002', clientVersion: '4.0.0' }
      );
      mockUsersRepository.createUser.mockRejectedValue(prismaError);

      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(
        ConflictException
      );
      expect(repository.createUser).toHaveBeenCalledWith(mockCreateUserDto);
    });

    it('should rethrow other errors', async () => {
      const genericError = new Error('Database connection failed');
      mockUsersRepository.createUser.mockRejectedValue(genericError);

      await expect(service.createUser(mockCreateUserDto)).rejects.toThrow(
        genericError
      );
      expect(repository.createUser).toHaveBeenCalledWith(mockCreateUserDto);
    });
  });

  describe('findUserById', () => {
    it('should return a user when found', async () => {
      mockUsersRepository.findUserById.mockResolvedValue(mockUser);

      const result = await service.findUserById('1');

      expect(repository.findUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUsersRepository.findUserById.mockResolvedValue(null);

      const result = await service.findUserById('nonexistent');

      expect(repository.findUserById).toHaveBeenCalledWith('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('findUserByEmail', () => {
    it('should return a user when found', async () => {
      mockUsersRepository.findUserByEmail.mockResolvedValue(mockUser);

      const result = await service.findUserByEmail('test@example.com');

      expect(repository.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUsersRepository.findUserByEmail.mockResolvedValue(null);

      const result = await service.findUserByEmail('nonexistent@example.com');

      expect(repository.findUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, ...mockUpdateUserDto };
      mockUsersRepository.updateUser.mockResolvedValue(updatedUser);

      const result = await service.updateUser('1', mockUpdateUserDto);

      expect(repository.updateUser).toHaveBeenCalledWith('1', mockUpdateUserDto);
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException when user not found during update', async () => {
      mockUsersRepository.updateUser.mockResolvedValue(null);

      await expect(service.updateUser('nonexistent', mockUpdateUserDto)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.updateUser).toHaveBeenCalledWith('nonexistent', mockUpdateUserDto);
    });

    it('should throw InternalServerErrorException for unexpected errors', async () => {
      const genericError = new Error('Database connection failed');
      mockUsersRepository.updateUser.mockRejectedValue(genericError);

      await expect(service.updateUser('1', mockUpdateUserDto)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(repository.updateUser).toHaveBeenCalledWith('1', mockUpdateUserDto);
    });

    it('should rethrow NotFoundException as is', async () => {
      const notFoundError = new NotFoundException('User not found');
      mockUsersRepository.updateUser.mockRejectedValue(notFoundError);

      await expect(service.updateUser('1', mockUpdateUserDto)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.updateUser).toHaveBeenCalledWith('1', mockUpdateUserDto);
    });
  });

  describe('findUserByRefreshToken', () => {
    it('should return a user when found by refresh token', async () => {
      const userWithRefreshToken = { ...mockUser, refresh_token: 'valid-refresh-token' };
      mockUsersRepository.findUserByRefreshToken.mockResolvedValue(userWithRefreshToken);

      const result = await service.findUserByRefreshToken('valid-refresh-token');

      expect(repository.findUserByRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(userWithRefreshToken);
    });

    it('should throw NotFoundException when user not found by refresh token', async () => {
      mockUsersRepository.findUserByRefreshToken.mockResolvedValue(null);

      await expect(service.findUserByRefreshToken('invalid-token')).rejects.toThrow(
        NotFoundException
      );
      expect(repository.findUserByRefreshToken).toHaveBeenCalledWith('invalid-token');
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
