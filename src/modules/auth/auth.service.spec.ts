import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  EmailAlreadyExistsException,
  WeakPasswordException,
  InvalidCredentialsException,
  EmailNotVerifiedException,
  EmailAlreadyVerifiedException,
  InvalidTokenException,
  TokenExpiredException,
  UserNotActiveException,
} from './exceptions/auth.exceptions';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let mailerService: jest.Mocked<MailerService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findUserByEmail: jest.fn(),
            findUserByNewEmail: jest.fn(),
            createUser: jest.fn(),
            updateUser: jest.fn(),
            findUserById: jest.fn(),
          },
        },
        { provide: MailerService, useValue: { send: jest.fn() } },
        { provide: JwtService, useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() } },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    mailerService = module.get(MailerService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // default mocks
    configService.get.mockReturnValue('10');
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as never);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('throws WeakPasswordException on invalid pwd', async () => {
      await expect(
        service.register({ email: 'a@a.com', password: 'weak' } as any),
      ).rejects.toBeInstanceOf(WeakPasswordException);
    });

    it('throws EmailAlreadyExistsException if email taken', async () => {
      usersService.findUserByEmail.mockResolvedValue({} as any);
      await expect(
        service.register({ email: 'a@b.com', password: 'Strong1!' } as any),
      ).rejects.toBeInstanceOf(EmailAlreadyExistsException);
    });

    it('creates user and sends verification email', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      usersService.findUserByNewEmail.mockResolvedValue(null);
      usersService.createUser.mockResolvedValue({ id: '1', email: 'a@b.com' } as any);
      const res = await service.register({ email: 'a@b.com', password: 'Strong1!' } as any);
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'a@b.com', password: 'hashed', verified_email: false }),
      );
      expect(mailerService.send).toHaveBeenCalled();
      expect(res).toEqual({
        message: 'User registered successfully, please check your email to verify your account.',
      });
    });
  });

  describe('login', () => {
    it('throws InvalidCredentialsException if no user', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      await expect(service.login('x', 'y')).rejects.toBeInstanceOf(InvalidCredentialsException);
    });

    it('throws InvalidCredentialsException on bad password', async () => {
      usersService.findUserByEmail.mockResolvedValue({
        password: 'hash',
        verified_email: true,
        isActive: true,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.login('x', 'y')).rejects.toBeInstanceOf(InvalidCredentialsException);
    });

    it('throws EmailNotVerifiedException if email not verified', async () => {
      usersService.findUserByEmail.mockResolvedValue({
        password: 'hash',
        verified_email: false,
        isActive: true,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.login('x', 'y')).rejects.toBeInstanceOf(EmailNotVerifiedException);
    });

    it('throws UserNotActiveException if user not active', async () => {
      usersService.findUserByEmail.mockResolvedValue({
        password: 'hash',
        verified_email: true,
        isActive: false,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      await expect(service.login('x', 'y')).rejects.toBeInstanceOf(UserNotActiveException);
    });

    it('returns tokens and user on success', async () => {
      const user = { id: '1', email: 'a@b.com', role: 'user', password: 'hash', verified_email: true, isActive: true } as any;
      usersService.findUserByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      const res = await service.login('a@b.com', 'Strong1!');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(usersService.updateUser).toHaveBeenCalledWith(user.id, {
        refresh_token: expect.any(String),
      });
      expect(res).toEqual({
        tokens: { access_token: 'access_token', refresh_token: 'refresh_token' },
        user: user,
      });
    });
  });

  describe('verifyEmail', () => {
    it('throws NotFoundException if user not found by email or newEmail', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      usersService.findUserByNewEmail.mockResolvedValue(null);
      await expect(service.verifyEmail('test@test.com', 'token')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InvalidTokenException if token does not match', async () => {
      usersService.findUserByEmail.mockResolvedValue({ verified_email: false, verify_token: 'different' } as any);
      usersService.findUserByNewEmail.mockResolvedValue(null);
      await expect(service.verifyEmail('test@test.com', 'token')).rejects.toBeInstanceOf(InvalidTokenException);
    });

    it('throws EmailAlreadyVerifiedException if email already verified (registration context)', async () => {
      usersService.findUserByEmail.mockResolvedValue({ verified_email: true, verify_token: 'token' } as any);
      usersService.findUserByNewEmail.mockResolvedValue(null);
      await expect(service.verifyEmail('test@test.com', 'token')).rejects.toBeInstanceOf(EmailAlreadyVerifiedException);
    });

    it('verifies email and returns tokens (registration context)', async () => {
      const user = { id: '1', email: 'test@test.com', role: 'user', verified_email: false, verify_token: 'token' } as any;
      usersService.findUserByEmail.mockResolvedValue(user);
      usersService.findUserByNewEmail.mockResolvedValue(null);
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      const res = await service.verifyEmail('test@test.com', 'token');
      expect(usersService.updateUser).toHaveBeenCalledWith(user.id, {
        verified_email: true,
        verify_token: null,
      });
      expect(res).toEqual({
        message: 'Email verified successfully',
        tokens: { access_token: 'access_token', refresh_token: 'refresh_token' },
      });
    });

    it('throws InvalidTokenException if newEmail does not match token email (email update context)', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      usersService.findUserByNewEmail.mockResolvedValue({ 
        id: '1', 
        email: 'old@test.com', 
        newEmail: 'different@test.com', 
        verify_token: 'token' 
      } as any);
      await expect(service.verifyEmail('new@test.com', 'token')).rejects.toBeInstanceOf(InvalidTokenException);
    });

    it('verifies new email and updates user (email update context)', async () => {
      const user = { 
        id: '1', 
        email: 'old@test.com', 
        newEmail: 'new@test.com', 
        role: 'user', 
        verify_token: 'token' 
      } as any;
      usersService.findUserByEmail.mockResolvedValue(null);
      usersService.findUserByNewEmail.mockResolvedValue(user);
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      const res = await service.verifyEmail('new@test.com', 'token');
      expect(usersService.updateUser).toHaveBeenCalledWith(user.id, {
        email: user.newEmail,
        newEmail: null,
        verified_email: true,
        verify_token: null,
      });
      expect(res).toEqual({
        message: 'Email updated and verified successfully',
        tokens: { access_token: 'access_token', refresh_token: 'refresh_token' },
      });
    });
  });

  describe('resendVerificationEmail', () => {
    it('throws NotFoundException if user not found', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      await expect(service.resendVerificationEmail('test@test.com')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws EmailAlreadyVerifiedException if email already verified', async () => {
      usersService.findUserByEmail.mockResolvedValue({ verified_email: true } as any);
      await expect(service.resendVerificationEmail('test@test.com')).rejects.toBeInstanceOf(EmailAlreadyVerifiedException);
    });

    it('resends verification email successfully', async () => {
      const user = { id: '1', email: 'test@test.com', verified_email: false } as any;
      usersService.findUserByEmail.mockResolvedValue(user);
      const res = await service.resendVerificationEmail('test@test.com');
      expect(usersService.updateUser).toHaveBeenCalledWith(user.id, {
        verify_token: expect.any(String),
      });
      expect(mailerService.send).toHaveBeenCalled();
      expect(res).toEqual({ message: 'Verification email sent successfully' });
    });
  });

  describe('verifyResetPasswordToken', () => {
    it('throws NotFoundException if user not found', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      await expect(service.verifyResetPasswordToken('test@test.com', 'token')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InvalidTokenException if token invalid', async () => {
      usersService.findUserByEmail.mockResolvedValue({ reset_token: 'different' } as any);
      await expect(service.verifyResetPasswordToken('test@test.com', 'token')).rejects.toBeInstanceOf(InvalidTokenException);
    });

    it('throws TokenExpiredException if token expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      usersService.findUserByEmail.mockResolvedValue({ reset_token: 'token', reset_token_expiry: expiredDate } as any);
      await expect(service.verifyResetPasswordToken('test@test.com', 'token')).rejects.toBeInstanceOf(TokenExpiredException);
    });

    it('returns success message if token is valid', async () => {
      const futureDate = new Date(Date.now() + 1000);
      usersService.findUserByEmail.mockResolvedValue({ reset_token: 'token', reset_token_expiry: futureDate } as any);
      const res = await service.verifyResetPasswordToken('test@test.com', 'token');
      expect(res).toEqual({ message: 'Reset password token is valid' });
    });

    it('returns success message if token is valid and no expiry date', async () => {
      usersService.findUserByEmail.mockResolvedValue({ reset_token: 'token', reset_token_expiry: null } as any);
      const res = await service.verifyResetPasswordToken('test@test.com', 'token');
      expect(res).toEqual({ message: 'Reset password token is valid' });
    });
  });

  describe('sendResetPasswordEmail', () => {
    it('throws NotFoundException if user not found', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      await expect(service.sendResetPasswordEmail('test@test.com')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('sends reset password email successfully', async () => {
      const user = { id: '1', email: 'test@test.com' } as any;
      usersService.findUserByEmail.mockResolvedValue(user);
      const res = await service.sendResetPasswordEmail('test@test.com');
      expect(usersService.updateUser).toHaveBeenCalledWith(user.id, {
        reset_token: expect.any(String),
        reset_token_expiry: expect.any(Date),
      });
      expect(mailerService.send).toHaveBeenCalled();
      expect(res).toEqual({ message: 'Reset password email sent successfully' });
    });
  });

  describe('resetPassword', () => {
    it('throws NotFoundException if user not found', async () => {
      usersService.findUserByEmail.mockResolvedValue(null);
      await expect(service.resetPassword('test@test.com', 'token', 'Strong1!')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws InvalidTokenException if token invalid', async () => {
      usersService.findUserByEmail.mockResolvedValue({ reset_token: 'different' } as any);
      await expect(service.resetPassword('test@test.com', 'token', 'Strong1!')).rejects.toBeInstanceOf(InvalidTokenException);
    });

    it('throws TokenExpiredException if token expired', async () => {
      const expiredDate = new Date(Date.now() - 1000);
      usersService.findUserByEmail.mockResolvedValue({ reset_token: 'token', reset_token_expiry: expiredDate } as any);
      await expect(service.resetPassword('test@test.com', 'token', 'Strong1!')).rejects.toBeInstanceOf(TokenExpiredException);
    });

    it('throws WeakPasswordException if password weak', async () => {
      const futureDate = new Date(Date.now() + 1000);
      usersService.findUserByEmail.mockResolvedValue({ reset_token: 'token', reset_token_expiry: futureDate } as any);
      await expect(service.resetPassword('test@test.com', 'token', 'weak')).rejects.toBeInstanceOf(WeakPasswordException);
    });

    it('resets password successfully', async () => {
      const futureDate = new Date(Date.now() + 1000);
      const user = { id: '1', email: 'test@test.com', role: 'user', reset_token: 'token', reset_token_expiry: futureDate } as any;
      usersService.findUserByEmail.mockResolvedValue(user);
      jwtService.signAsync
        .mockResolvedValueOnce('access_token')
        .mockResolvedValueOnce('refresh_token');
      const res = await service.resetPassword('test@test.com', 'token', 'Strong1!');
      expect(usersService.updateUser).toHaveBeenCalledWith(user.id, {
        password: 'hashed',
        reset_token: null,
        reset_token_expiry: null,
      });
      expect(res).toEqual({
        message: 'Password reset successfully',
        tokens: { access_token: 'access_token', refresh_token: 'refresh_token' },
      });
    });
  });

  describe('refreshToken', () => {
    it('throws TokenExpiredException on expired token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new TokenExpiredError('expired', new Date()));
      await expect(service.refreshToken('token')).rejects.toBeInstanceOf(TokenExpiredException);
    });

    it('throws InvalidTokenException on invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));
      await expect(service.refreshToken('token')).rejects.toBeInstanceOf(InvalidTokenException);
    });

    it('throws InvalidTokenException if user not found', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: '1' });
      usersService.findUserById.mockResolvedValue(null);
      await expect(service.refreshToken('token')).rejects.toBeInstanceOf(InvalidTokenException);
    });

    it('throws InvalidTokenException if refresh token invalid', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: '1' });
      usersService.findUserById.mockResolvedValue({ refresh_token: 'hashed' } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);
      await expect(service.refreshToken('token')).rejects.toBeInstanceOf(InvalidTokenException);
    });

    it('returns new tokens on success', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: '1' });
      const user = { id: '1', email: 'test@test.com', role: 'user', refresh_token: 'hashed' } as any;
      usersService.findUserById.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('new_access_token')
        .mockResolvedValueOnce('new_refresh_token');
      const res = await service.refreshToken('token');
      expect(res).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      });
    });
  });

  describe('logout', () => {
    it('throws NotFoundException if user not found', async () => {
      usersService.findUserById.mockResolvedValue(null);
      await expect(service.logout('1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('clears refresh token and returns success message', async () => {
      const user = { id: '1', email: 'test@test.com', refresh_token: 'some_token' } as any;
      usersService.findUserById.mockResolvedValue(user);
      const res = await service.logout('1');
      expect(usersService.updateUser).toHaveBeenCalledWith(user.id, {
        refresh_token: null,
      });
      expect(res).toEqual({ message: 'Logged out successfully' });
    });
  });
});
