import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '@prisma/client';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { MailerService } from '../mailer/mailer.service';
import {verifyEmailTemplate} from '../mailer/mail_templates/index';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';


const PASSWORD_POLICY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        private readonly usersService: UsersService, 
        private readonly mailerService: MailerService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ){}

    async register(createUserDto: CreateUserDto){

        //validate password
        if (!this.validatePassword(createUserDto.password)) {
            throw new BadRequestException(
            'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
            );
        }

        //check if email is already registered
        const userexist = await this.usersService.findUserByEmail(createUserDto.email);
        if (userexist) {
            throw new BadRequestException('Email already registered');
        }

        //hash password
        const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10', 10);
        this.logger.debug(`Using ${saltRounds} salt rounds for password hashing`);
        this.logger.debug('typeof saltRounds: ' + typeof saltRounds);

        const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

        const verifyToken = this.generateVerificationToken();
        const user = await this.usersService.createUser({
            ...createUserDto,
            password: hashedPassword,
            verify_token: verifyToken,
            verified_email: false,
        });
        // Send verification email 
        await this.sendVerificationEmail(user, verifyToken);

        return {message: 'User registered successfully, please check your email to verify your account.'};

    }

    async verifyEmail(token: string, email: string) {
        const user = await this.usersService.findUserByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if (user.verified_email) {
            throw new BadRequestException('Email already verified');
        }
        if (user.verify_token !== token) {
            throw new BadRequestException('Invalid verification token');
        }
        // Update user to mark email as verified
        await this.usersService.updateUser(user.id, {
            verified_email: true,
            verify_token: null, 
        });
        
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return {
            message: 'Email verified successfully',
            tokens: tokens,
        };
    }

    // return user data with the access token 
    async login(email: string, password: string) {
        const user = await this.usersService.findUserByEmail(email);
        if (!user) {
            throw new BadRequestException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid email or password');
        }
        if (!user.verified_email) {
            throw new BadRequestException('Email not verified');
        }

        const tokens = await this.generateTokens(user.id, user.email, user.role);
        
        return { tokens };
    }

    async resendVerificationEmail(email: string) {
        this.logger.debug(`Resending verification email to: ${email}`);
        const verifyToken = this.generateVerificationToken();

        const user = await this.usersService.findUserByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if (user.verified_email) {
            throw new BadRequestException('Email already verified');
        }
        // Update user with new verification token
        await this.usersService.updateUser(user.id, {
            verify_token: verifyToken,
        })
        // Send verification email
        await this.sendVerificationEmail(user, verifyToken);
        return {message: 'Verification email sent successfully'};
    }

    async sendResetPasswordEmail(email: string): Promise<{message: string}> {
        const user = await this.usersService.findUserByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        const resetToken = this.generateVerificationToken();
        const resetExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
        await this.usersService.updateUser(user.id, {
            reset_token: resetToken,
            reset_token_expiry: resetExpiry,
        });
        // Send reset password email
        await this.sendVerificationEmail(user, resetToken);
        return { message: 'Reset password email sent successfully' };
    }

    async resetPassword(token: string, email: string, newPassword: string) {
        const user = await this.usersService.findUserByEmail(email);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if (user.reset_token !== token) {
            throw new BadRequestException('Invalid reset token');
        }
        if (user.reset_token_expiry && user.reset_token_expiry < new Date()) {
            throw new BadRequestException('Reset token expired');
        }
        if (!this.validatePassword(newPassword)) {
            throw new BadRequestException(
                'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character',
            );
        }
        const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10', 10);
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        await this.usersService.updateUser(user.id, {
            password: hashedPassword,
            reset_token: null,
            reset_token_expiry: null,
        });
       
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return { 
            message: 'Password reset successfully',
            tokens,
        };
    }

    async refreshToken(refreshToken: string) {
        const user = await this.usersService.findUserByRefreshToken(refreshToken);
        if (!user) {
            throw new BadRequestException('Invalid refresh token');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        await this.updateRefreshToken(user.id, refreshToken);
        return {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
        };
    }


    




    private validatePassword(password: string): boolean {
        return PASSWORD_POLICY_PATTERN.test(password);
    }
    
    private generateVerificationToken(): string {
        const pattern = /^(?=.*[a-z])(?=.*\d)[a-z0-9]{6}$/;
        let token: string;
        do {
            token = randomBytes(3).toString('hex');
        } while (!pattern.test(token));
        return token;
    }

    // sendVerificationEmail will be used for both verification and reset password emails
    // use a template for the email body
    private async sendVerificationEmail(user: User, token: string) {
        let html = verifyEmailTemplate;
        html = html.replaceAll('&CODE&', token);
        this.mailerService.send(user.email, 'Verify your email', html);
    }

    private async generateTokens(userId: string, email: string, role: string ) {
        const payload = {
            sub: userId,
            email: email,
            role: role,
        }
        const [access_token, refresh_token] = await Promise.all([
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION_TIME') || '15m',
            }),
            this.jwtService.signAsync(payload, {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION_TIME') || '7d',
            }),

        ]);
        return {
            access_token,
            refresh_token,
        };
    }
    async updateRefreshToken(userId: string, refreshToken: string) {
        const saltRounds = parseInt(this.configService.get<string>('BCRYPT_SALT_ROUNDS') || '10', 10);
        const hashed = await bcrypt.hash(refreshToken, saltRounds);
        await this.usersService.updateUser(userId, {
            refresh_token: hashed,
        })
    }

}
