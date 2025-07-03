import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailDto } from '../users/dto/email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UserType, Country, Prefix, Role } from '@prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockResponse = () => {
    const res: any = {};
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  const mockRequest = (cookies: any = {}) => ({
    cookies,
  });

  beforeEach(async () => {
    const mockAuthService = {
      register: jest.fn(),
      login: jest.fn(),
      verifyEmail: jest.fn(),
      resendVerificationEmail: jest.fn(),
      sendResetPasswordEmail: jest.fn(),
      resetPassword: jest.fn(),
      refreshToken: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'Strong1!',
        type: UserType.PARTICULIER,
        firstName: 'John',
        lastName: 'Doe',
        country: Country.Kuwait,
        prefix: Prefix.PLUS_965,
        phoneNumber: 12345678,
        verify_token: null,
        verified_email: false,
      };

      const mockResult = {
        message: 'User registered successfully, please check your email to verify your account.',
      };

      authService.register.mockResolvedValue(mockResult);

      const result = await controller.register(createUserDto);

      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(plainToInstance(UserResponseDto, mockResult));
    });

    it('should throw error when registration fails', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@test.com',
        password: 'weak',
        type: UserType.PARTICULIER,
        firstName: 'John',
        lastName: 'Doe',
        country: Country.Kuwait,
        prefix: Prefix.PLUS_965,
        phoneNumber: 12345678,
        verify_token: null,
        verified_email: false,
      };

      authService.register.mockRejectedValue(new Error('Registration failed'));

      await expect(controller.register(createUserDto)).rejects.toThrow('Registration failed');
      expect(authService.register).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should login successfully and set refresh token cookie', async () => {
      const loginDto: LoginDto = {
        email: 'test@test.com',
        password: 'Strong1!',
      };

      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedpassword',
        type: UserType.PARTICULIER,
        firstName: 'John',
        lastName: 'Doe',
        country: Country.Kuwait,
        prefix: Prefix.PLUS_965,
        phoneNumber: 12345678,
        verify_token: null,
        verified_email: true,
        reset_token: null,
        reset_token_expiry: null,
        role: Role.USER,
        refresh_token: null,
        profilePicture: null,
        isActive: true,
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResult = {
        tokens: {
          access_token: 'access_token_value',
          refresh_token: 'refresh_token_value',
        },
        user: mockUser,
      };

      authService.login.mockResolvedValue(mockResult);
      const res = mockResponse();

      await controller.login(loginDto, res);

      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh_token_value', expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }));
      expect(res.json).toHaveBeenCalledWith({
        access_token: 'access_token_value',
        user: plainToInstance(UserResponseDto, mockUser),
      });
    });

    it('should throw error when login fails', async () => {
      const loginDto: LoginDto = {
        email: 'test@test.com',
        password: 'wrong_password',
      };

      authService.login.mockRejectedValue(new Error('Invalid credentials'));
      const res = mockResponse();

      await expect(controller.login(loginDto, res)).rejects.toThrow('Invalid credentials');
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully and set refresh token cookie', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'test@test.com',
        token: '123456',
      };

      const mockResult = {
        message: 'Email verified successfully',
        tokens: {
          access_token: 'access_token_value',
          refresh_token: 'refresh_token_value',
        },
      };

      authService.verifyEmail.mockResolvedValue(mockResult);
      const res = mockResponse();

      await controller.verifyEmail(verifyEmailDto, res);

      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto.email, verifyEmailDto.token);
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh_token_value', expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }));
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email verified successfully',
        access_token: 'access_token_value',
      });
    });

    it('should throw error when email verification fails', async () => {
      const verifyEmailDto: VerifyEmailDto = {
        email: 'test@test.com',
        token: 'invalid',
      };

      authService.verifyEmail.mockRejectedValue(new Error('Invalid token'));
      const res = mockResponse();

      await expect(controller.verifyEmail(verifyEmailDto, res)).rejects.toThrow('Invalid token');
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email successfully', async () => {
      const emailDto: EmailDto = {
        email: 'test@test.com',
      };

      const mockResult = {
        message: 'Verification email sent successfully',
      };

      authService.resendVerificationEmail.mockResolvedValue(mockResult);

      const result = await controller.resendVerification(emailDto);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(emailDto.email);
      expect(result).toEqual(mockResult);
    });

    it('should throw error when resend verification fails', async () => {
      const emailDto: EmailDto = {
        email: 'nonexistent@test.com',
      };

      authService.resendVerificationEmail.mockRejectedValue(new Error('User not found'));

      await expect(controller.resendVerification(emailDto)).rejects.toThrow('User not found');
    });
  });

  describe('forgotPassword', () => {
    it('should send reset password email successfully', async () => {
      const emailDto: EmailDto = {
        email: 'test@test.com',
      };

      const mockResult = {
        message: 'Reset password email sent successfully',
      };

      authService.sendResetPasswordEmail.mockResolvedValue(mockResult);

      const result = await controller.forgotPassword(emailDto);

      expect(authService.sendResetPasswordEmail).toHaveBeenCalledWith(emailDto.email);
      expect(result).toEqual(mockResult);
    });

    it('should throw error when forgot password fails', async () => {
      const emailDto: EmailDto = {
        email: 'nonexistent@test.com',
      };

      authService.sendResetPasswordEmail.mockRejectedValue(new Error('User not found'));

      await expect(controller.forgotPassword(emailDto)).rejects.toThrow('User not found');
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully and set refresh token cookie', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: 'test@test.com',
        token: '123456',
        password: 'NewStrong1!',
      };

      const mockResult = {
        message: 'Password reset successfully',
        tokens: {
          access_token: 'access_token_value',
          refresh_token: 'refresh_token_value',
        },
      };

      authService.resetPassword.mockResolvedValue(mockResult);
      const res = mockResponse();

      await controller.resetPassword(resetPasswordDto, res);

      expect(authService.resetPassword).toHaveBeenCalledWith(
        resetPasswordDto.email,
        resetPasswordDto.token,
        resetPasswordDto.password
      );
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'refresh_token_value', expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }));
      expect(res.json).toHaveBeenCalledWith({
        message: 'Password reset successfully',
        access_token: 'access_token_value',
      });
    });

    it('should throw error when reset password fails', async () => {
      const resetPasswordDto: ResetPasswordDto = {
        email: 'test@test.com',
        token: 'invalid',
        password: 'NewStrong1!',
      };

      authService.resetPassword.mockRejectedValue(new Error('Invalid token'));
      const res = mockResponse();

      await expect(controller.resetPassword(resetPasswordDto, res)).rejects.toThrow('Invalid token');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully when refresh token exists in cookies', async () => {
      const mockTokens = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      };

      authService.refreshToken.mockResolvedValue(mockTokens);
      const req = mockRequest({ refresh_token: 'existing_refresh_token' });
      const res = mockResponse();

      await controller.refreshToken(req, res);

      expect(authService.refreshToken).toHaveBeenCalledWith('existing_refresh_token');
      expect(res.cookie).toHaveBeenCalledWith('refresh_token', 'new_refresh_token', expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }));
      expect(res.json).toHaveBeenCalledWith({
        access_token: 'new_access_token',
      });
    });

    it('should throw ForbiddenException when refresh token is not found in cookies', async () => {
      const req = mockRequest({});
      const res = mockResponse();

      await expect(controller.refreshToken(req, res)).rejects.toThrow(ForbiddenException);
      await expect(controller.refreshToken(req, res)).rejects.toThrow('Refresh token not found');
    });

    it('should throw error when refresh token service fails', async () => {
      authService.refreshToken.mockRejectedValue(new Error('Invalid refresh token'));
      const req = mockRequest({ refresh_token: 'invalid_token' });
      const res = mockResponse();

      await expect(controller.refreshToken(req, res)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear refresh token cookie', async () => {
      const mockResult = {
        message: 'Logged out successfully',
      };

      authService.logout.mockResolvedValue(mockResult);
      const res = mockResponse();

      await controller.logout('user123', res);

      expect(authService.logout).toHaveBeenCalledWith('user123');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token', expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }));
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged out successfully',
      });
    });

    it('should throw error when logout service fails', async () => {
      authService.logout.mockRejectedValue(new Error('User not found'));
      const res = mockResponse();

      await expect(controller.logout('invalid_user', res)).rejects.toThrow('User not found');
      expect(authService.logout).toHaveBeenCalledWith('invalid_user');
    });
  });

  describe('getCookieOptions', () => {
    it('should return correct cookie options', () => {
      const originalEnv = process.env.NODE_ENV;
      
      // Test production environment
      process.env.NODE_ENV = 'production';
      const cookieOptions = (controller as any).getCookieOptions();
      
      expect(cookieOptions).toEqual({
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Test development environment
      process.env.NODE_ENV = 'development';
      const devCookieOptions = (controller as any).getCookieOptions();
      
      expect(devCookieOptions).toEqual({
        httpOnly: true,
        secure: false,
        sameSite: 'Strict',
        path: '/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});
