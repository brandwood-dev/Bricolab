import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Prisma, User, UserType, Country, Prefix, Role } from '@prisma/client';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UplaodService } from '../uplaod/uplaod.service';
import { MailerService } from '../mailer/mailer.service';

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
    profilePicture: null,
    isActive: true,
    isVerified: false,
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
    getUsers: jest.fn(),
    deleteUser: jest.fn(),
  };

  const mockUplaodService = {
    uploadFileLocal: jest.fn(),
  };

  const mockMailerService = {
    send: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: UplaodService,
          useValue: mockUplaodService,
        },
        {
          provide: MailerService,
          useValue: mockMailerService,
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

  describe('uploadProfilePicture', () => {
    const mockFile = {
      fieldname: 'profilePicture',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
      size: 1024,
    } as Express.Multer.File;

    it('should upload profile picture successfully', async () => {
      const imageUrl = '/uploads/profile-pictures/test.jpg';
      mockUsersRepository.findUserById.mockResolvedValue(mockUser);
      mockUplaodService.uploadFileLocal.mockResolvedValue(imageUrl);
      mockUsersRepository.updateUser.mockResolvedValue({ ...mockUser, profilePicture: imageUrl });

      const result = await service.uploadProfilePicture('1', mockFile);

      expect(repository.findUserById).toHaveBeenCalledWith('1');
      expect(mockUplaodService.uploadFileLocal).toHaveBeenCalledWith(mockFile, 'profile-pictures');
      expect(repository.updateUser).toHaveBeenCalledWith('1', { profilePicture: imageUrl });
      expect(result).toEqual({
        message: 'Profile picture uploaded successfully',
        imageUrl: imageUrl
      });
    });

    it('should throw BadRequestException when no file provided', async () => {
      await expect(service.uploadProfilePicture('1', undefined as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findUserById.mockResolvedValue(null);

      await expect(service.uploadProfilePicture('nonexistent', mockFile)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.findUserById).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('getUsers', () => {
    it('should return paginated users', async () => {
      const mockResult = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };
      mockUsersRepository.getUsers.mockResolvedValue(mockResult);

      const result = await service.getUsers(1, 10, 'search');

      expect(repository.getUsers).toHaveBeenCalledWith(1, 10, 'search');
      expect(result).toEqual(mockResult);
    });

    it('should return paginated users without search', async () => {
      const mockResult = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      };
      mockUsersRepository.getUsers.mockResolvedValue(mockResult);

      const result = await service.getUsers(1, 10);

      expect(repository.getUsers).toHaveBeenCalledWith(1, 10, undefined);
      expect(result).toEqual(mockResult);
    });
  });

  describe('deleteUser', () => {
    const motive = 'Account violation';

    it('should delete user and send email successfully', async () => {
      mockUsersRepository.deleteUser.mockResolvedValue(mockUser);
      mockMailerService.send.mockResolvedValue(true);

      const result = await service.deleteUser('1', motive);

      expect(repository.deleteUser).toHaveBeenCalledWith('1');
      expect(mockMailerService.send).toHaveBeenCalledWith(
        mockUser.email,
        'Suppression de votre compte',
        expect.any(String)
      );
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.deleteUser.mockResolvedValue(null);

      await expect(service.deleteUser('nonexistent', motive)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.deleteUser).toHaveBeenCalledWith('nonexistent');
    });
  });

  describe('changeUserStatus', () => {
    const motive = 'Account review completed';

    it('should activate inactive user and send email', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const activatedUser = { ...mockUser, isActive: true };
      
      mockUsersRepository.findUserById.mockResolvedValue(inactiveUser);
      mockUsersRepository.updateUser.mockResolvedValue(activatedUser);
      mockMailerService.send.mockResolvedValue(true);

      const result = await service.changeUserStatus('1', motive);

      expect(repository.findUserById).toHaveBeenCalledWith('1');
      expect(repository.updateUser).toHaveBeenCalledWith('1', { isActive: true });
      expect(mockMailerService.send).toHaveBeenCalledWith(
        inactiveUser.email,
        'compte activé',
        expect.any(String)
      );
      expect(result).toEqual(activatedUser);
    });

    it('should deactivate active user and send email', async () => {
      const activeUser = { ...mockUser, isActive: true };
      const deactivatedUser = { ...mockUser, isActive: false };
      
      mockUsersRepository.findUserById.mockResolvedValue(activeUser);
      mockUsersRepository.updateUser.mockResolvedValue(deactivatedUser);
      mockMailerService.send.mockResolvedValue(true);

      const result = await service.changeUserStatus('1', motive);

      expect(repository.findUserById).toHaveBeenCalledWith('1');
      expect(repository.updateUser).toHaveBeenCalledWith('1', { isActive: false });
      expect(mockMailerService.send).toHaveBeenCalledWith(
        activeUser.email,
        'compte désactivé',
        expect.any(String)
      );
      expect(result).toEqual(deactivatedUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      mockUsersRepository.findUserById.mockResolvedValue(null);

      await expect(service.changeUserStatus('nonexistent', motive)).rejects.toThrow(
        NotFoundException
      );
      expect(repository.findUserById).toHaveBeenCalledWith('nonexistent');
    });

    it('should change status without motive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      const activatedUser = { ...mockUser, isActive: true };
      
      mockUsersRepository.findUserById.mockResolvedValue(inactiveUser);
      mockUsersRepository.updateUser.mockResolvedValue(activatedUser);
      mockMailerService.send.mockResolvedValue(true);

      const result = await service.changeUserStatus('1');

      expect(repository.findUserById).toHaveBeenCalledWith('1');
      expect(repository.updateUser).toHaveBeenCalledWith('1', { isActive: true });
      expect(mockMailerService.send).toHaveBeenCalledWith(
        inactiveUser.email,
        'compte activé',
        expect.any(String)
      );
      expect(result).toEqual(activatedUser);
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
