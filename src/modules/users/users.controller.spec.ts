import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { BadRequestException } from '@nestjs/common';
import { UserResponseDto } from './dto/user-response.dto';
import { User, UserType, Country, Prefix, Role } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

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
    idCardFront: null,
    idCardBack: null,
    isActive: true,
    isVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    findUserById: jest.fn(),
    uploadProfilePicture: jest.fn(),
    getUsers: jest.fn(),
    deleteUser: jest.fn(),
    changeUserStatus: jest.fn(),
    uploadIdCard: jest.fn(),
    verifyUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getUserById', () => {
    it('should return a user by id', async () => {
      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.getUserById('1');

      expect(service.findUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUser));
    });

    it('should handle when user is not found', async () => {
      mockUsersService.findUserById.mockResolvedValue(null);

      const result = await controller.getUserById('nonexistent');

      expect(service.findUserById).toHaveBeenCalledWith('nonexistent');
      expect(result).toEqual(plainToInstance(UserResponseDto, null));
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      mockUsersService.findUserById.mockResolvedValue(mockUser);

      const result = await controller.getCurrentUser('1');

      expect(service.findUserById).toHaveBeenCalledWith('1');
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUser));
    });
  });

  describe('uploadProfilePicture', () => {
    const mockFile = {
      fieldname: 'file',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('fake image data'),
      size: 1024,
    } as Express.Multer.File;

    it('should upload profile picture successfully', async () => {
      const mockResult = {
        message: 'Profile picture uploaded successfully',
        imageUrl: '/uploads/profile-pictures/test.jpg'
      };
      mockUsersService.uploadProfilePicture.mockResolvedValue(mockResult);

      const result = await controller.uploadProfilePicture('1', mockFile);

      expect(service.uploadProfilePicture).toHaveBeenCalledWith('1', mockFile);
      expect(result).toEqual(mockResult);
    });

    it('should handle upload errors', async () => {
      const error = new BadRequestException('Upload failed');
      mockUsersService.uploadProfilePicture.mockRejectedValue(error);

      await expect(controller.uploadProfilePicture('1', mockFile)).rejects.toThrow(
        BadRequestException
      );
      expect(service.uploadProfilePicture).toHaveBeenCalledWith('1', mockFile);
    });
  });

  describe('getUsers', () => {
    it('should return paginated users with default values', async () => {
      const mockResult = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1
        }
      };
      mockUsersService.getUsers.mockResolvedValue(mockResult);

      const result = await controller.getUsers();

      expect(service.getUsers).toHaveBeenCalledWith(1, 20, undefined);
      expect(result).toEqual(mockResult);
    });

    it('should return paginated users with custom parameters', async () => {
      const mockResult = {
        data: [mockUser],
        meta: {
          total: 1,
          page: 2,
          limit: 10,
          totalPages: 1
        }
      };
      mockUsersService.getUsers.mockResolvedValue(mockResult);

      const result = await controller.getUsers(2, 10, 'search term');

      expect(service.getUsers).toHaveBeenCalledWith(2, 10, 'search term');
      expect(result).toEqual(mockResult);
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      mockUsersService.getUsers.mockRejectedValue(error);

      await expect(controller.getUsers(1, 10)).rejects.toThrow(error);
      expect(service.getUsers).toHaveBeenCalledWith(1, 10, undefined);
    });
  });

  describe('deleteUser', () => {
    const motive = 'Account violation';

    it('should delete user successfully', async () => {
      mockUsersService.deleteUser.mockResolvedValue(mockUser);

      const result = await controller.deleteUser('1', motive);

      expect(service.deleteUser).toHaveBeenCalledWith('1', motive);
      expect(result).toEqual(plainToInstance(UserResponseDto, mockUser));
    });

    it('should handle delete errors', async () => {
      const error = new Error('Delete failed');
      mockUsersService.deleteUser.mockRejectedValue(error);

      await expect(controller.deleteUser('1', motive)).rejects.toThrow(error);
      expect(service.deleteUser).toHaveBeenCalledWith('1', motive);
    });
  });

  describe('changeUserStatus', () => {
    const motive = 'Account review completed';

    it('should change user status with motive', async () => {
      const updatedUser = { ...mockUser, isActive: false };
      mockUsersService.changeUserStatus.mockResolvedValue(updatedUser);

      const result = await controller.changeUserStatus('1', motive);

      expect(service.changeUserStatus).toHaveBeenCalledWith('1', motive);
      expect(result).toEqual(plainToInstance(UserResponseDto, updatedUser));
    });

    it('should change user status without motive', async () => {
      const updatedUser = { ...mockUser, isActive: false };
      mockUsersService.changeUserStatus.mockResolvedValue(updatedUser);

      const result = await controller.changeUserStatus('1');

      expect(service.changeUserStatus).toHaveBeenCalledWith('1', undefined);
      expect(result).toEqual(plainToInstance(UserResponseDto, updatedUser));
    });

    it('should handle status change errors', async () => {
      const error = new Error('Status change failed');
      mockUsersService.changeUserStatus.mockRejectedValue(error);

      await expect(controller.changeUserStatus('1', motive)).rejects.toThrow(error);
      expect(service.changeUserStatus).toHaveBeenCalledWith('1', motive);
    });
  });

  describe('uploadIdCard', () => {
    const mockFiles = {
      idFront: [{
        fieldname: 'idFront',
        originalname: 'id-front.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake front id data'),
        size: 1024,
      } as Express.Multer.File],
      idBack: [{
        fieldname: 'idBack',
        originalname: 'id-back.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('fake back id data'),
        size: 1024,
      } as Express.Multer.File]
    };

    it('should upload ID card files successfully', async () => {
      const mockResult = {
        message: 'ID card uploaded successfully',
        idCardFront: '/uploads/id-cards/front-123.jpg',
        idCardBack: '/uploads/id-cards/back-123.jpg'
      };
      mockUsersService.uploadIdCard.mockResolvedValue(mockResult);

      const result = await controller.uploadIdCard('1', mockFiles);

      expect(service.uploadIdCard).toHaveBeenCalledWith('1', [mockFiles.idFront[0], mockFiles.idBack[0]]);
      expect(result).toEqual(mockResult);
    });

    it('should handle upload errors', async () => {
      const error = new BadRequestException('ID card upload failed');
      mockUsersService.uploadIdCard.mockRejectedValue(error);

      await expect(controller.uploadIdCard('1', mockFiles)).rejects.toThrow(
        BadRequestException
      );
      expect(service.uploadIdCard).toHaveBeenCalledWith('1', [mockFiles.idFront[0], mockFiles.idBack[0]]);
    });
  });

  describe('verifyAccount', () => {
    it('should verify user account successfully', async () => {
      const verifiedUser = { ...mockUser, isVerified: true };
      mockUsersService.verifyUser.mockResolvedValue(verifiedUser);

      const result = await controller.verifyAccount('1');

      expect(service.verifyUser).toHaveBeenCalledWith('1');
      expect(result).toEqual(plainToInstance(UserResponseDto, verifiedUser));
    });

    it('should handle verification errors', async () => {
      const error = new Error('Verification failed');
      mockUsersService.verifyUser.mockRejectedValue(error);

      await expect(controller.verifyAccount('1')).rejects.toThrow(error);
      expect(service.verifyUser).toHaveBeenCalledWith('1');
    });

    it('should handle user not found during verification', async () => {
      const error = new BadRequestException('User not found');
      mockUsersService.verifyUser.mockRejectedValue(error);

      await expect(controller.verifyAccount('nonexistent')).rejects.toThrow(
        BadRequestException
      );
      expect(service.verifyUser).toHaveBeenCalledWith('nonexistent');
    });
  });

  // Test file filter functionality (simulate the imageFileFilter function)
  describe('imageFileFilter', () => {
    const imageFileFilter = (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png)$/)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    };

    it('should accept valid image files', () => {
      const validFile = { mimetype: 'image/jpeg' };
      const callback = jest.fn();

      imageFileFilter(null, validFile, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should reject invalid file types', () => {
      const invalidFile = { mimetype: 'text/plain' };
      const callback = jest.fn();

      imageFileFilter(null, invalidFile, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        false
      );
    });

    it('should accept png files', () => {
      const pngFile = { mimetype: 'image/png' };
      const callback = jest.fn();

      imageFileFilter(null, pngFile, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });

    it('should accept jpg files', () => {
      const jpgFile = { mimetype: 'image/jpg' };
      const callback = jest.fn();

      imageFileFilter(null, jpgFile, callback);

      expect(callback).toHaveBeenCalledWith(null, true);
    });
  });
});