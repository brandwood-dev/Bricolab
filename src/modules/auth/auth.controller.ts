import { Body, Controller, ForbiddenException, Logger, Patch, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailDto } from '../users/dto/email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { 
    ApiTags, 
    ApiOperation, 
    ApiBody, 
    ApiBadRequestResponse, 
    ApiUnauthorizedResponse,
    ApiForbiddenResponse,
    ApiTooManyRequestsResponse,
    ApiCreatedResponse,
    ApiOkResponse 
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from '../users/dto/user-response.dto';


@ApiTags('Authentication')
@Controller('auth')
@Throttle({ default: { limit: 5, ttl: 60000 } }) 
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(
        private readonly authService: AuthService,
    ){}
    private getCookieOptions(){
        return {
            httpOnly: true, //The cookie can't be accessed via JavaScript (document.cookie). Prevents XSS attacks.
            secure: process.env.NODE_ENV === 'production', //The cookie is only sent over HTTPS connections
            sameSite: 'Strict', //The cookie is not sent on cross-origin requests — prevents CSRF.
            path: '/auth/refresh',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        }
    }
    @Post('register')
    @ApiOperation({ 
        summary: 'Register a new user',
        description: 'Creates a new user account and sends a verification email'
    })
    @ApiBody({
        type: CreateUserDto,
        description: 'User registration data',
        examples: {
            example1: {
                summary: 'Standard user registration',
                value: {
                    email: 'user@example.com',
                    password: 'StrongPassword123!',
                    firstName: 'John',
                    lastName: 'Doe',
                    country: 'Kuwait',
                    type: 'PARTICULIER',
                    prefix: 'PLUS_123',
                    phoneNumber: '+1234567890'
                }
            }
        }
    })
    @ApiCreatedResponse({ 
        description: 'User registered successfully. Verification email sent.',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User registered successfully. Please check your email to verify your account.' }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Invalid input data or user already exists',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Email already exists' },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded (5 requests per minute)'
    })
    async register(@Body() createUserDto: CreateUserDto) {
        const user = await this.authService.register(createUserDto);
        return plainToInstance(UserResponseDto,user);
    }
    @Post('login')
    @ApiOperation({ 
        summary: 'User login',
        description: 'Authenticates user credentials and returns access token with refresh token cookie'
    })
    @ApiBody({
        type: LoginDto,
        description: 'User login credentials',
        examples: {
            example1: {
                summary: 'User login',
                value: {
                    email: 'user@example.com',
                    password: 'StrongPassword123!'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Login successful',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
            }
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'Invalid credentials or email not verified',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Invalid credentials' },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Invalid input data'
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded'
    })
    async login(@Body() loginDto: LoginDto, @Res() res):Promise<{ access_token: string }> {
        const result = await this.authService.login(loginDto.email, loginDto.password);
        const refresh_token = result.tokens.refresh_token;
        res.cookie('refresh_token', refresh_token, this.getCookieOptions());
        return res.json({
        access_token: result.tokens.access_token,
        user:plainToInstance(UserResponseDto,result.user)
    });
    }
    @Post('verify-email')
    @ApiOperation({ 
        summary: 'Verify email address',
        description: 'Verifies user email using the token sent via email and returns access token'
    })
    @ApiBody({
        type: VerifyEmailDto,
        description: 'Email verification data',
        examples: {
            example1: {
                summary: 'Email verification',
                value: {
                    email: 'user@example.com',
                    token: 'abc123def456ghi789'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Email verified successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Email verified successfully' },
                access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Invalid or expired verification token',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Invalid or expired verification token' },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded'
    })
    async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto, @Res() res) {
        const result = await this.authService.verifyEmail(verifyEmailDto.email, verifyEmailDto.token);
        const refresh_token = result.tokens.refresh_token;
        res.cookie('refresh_token', refresh_token, this.getCookieOptions());
        return res.json({
            message: result.message,
            access_token: result.tokens.access_token,
        });
    }

    @Post('resend-verification')
    @Throttle({ default: { limit: 1, ttl: 60000 } })
    @ApiOperation({ 
        summary: 'Resend verification email',
        description: 'Resends the email verification token to the user\'s email address'
    })
    @ApiBody({
        type: EmailDto,
        description: 'Email address to resend verification to',
        examples: {
            example1: {
                summary: 'Resend verification email',
                value: {
                    email: 'user@example.com'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Verification email sent successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Verification email sent successfully' }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'User not found or email already verified',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User not found or email already verified' },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded (1 request per minute)'
    })
    async resendVerification(@Body() emailDto: EmailDto) {
        const result = await this.authService.resendVerificationEmail(emailDto.email);
        return result;
    }
    @Post('forgot-password')
    @Throttle({ default: { limit: 1, ttl: 60000 } })
    @ApiOperation({ 
        summary: 'Request password reset',
        description: 'Sends a password reset email to the user\'s email address'
    })
    @ApiBody({
        type: EmailDto,
        description: 'Email address to send password reset to',
        examples: {
            example1: {
                summary: 'Request password reset',
                value: {
                    email: 'user@example.com'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Password reset email sent successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Password reset email sent successfully' }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'User not found',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'User not found' },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded (1 request per minute)'
    })
    async forgotPassword(@Body() emailDto: EmailDto) {
        const result = await this.authService.sendResetPasswordEmail(emailDto.email);
        return result;
    }
    @Patch('reset-password')
    @ApiOperation({ 
        summary: 'Reset password',
        description: 'Resets user password using the token sent via email and returns access token'
    })
    @ApiBody({
        type: ResetPasswordDto,
        description: 'Password reset data',
        examples: {
            example1: {
                summary: 'Reset password',
                value: {
                    email: 'user@example.com',
                    token: 'abc123def456ghi789',
                    password: 'NewStrongPassword123!'
                }
            }
        }
    })
    @ApiOkResponse({ 
        description: 'Password reset successfully',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Password reset successfully' },
                access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
            }
        }
    })
    @ApiBadRequestResponse({ 
        description: 'Invalid or expired reset token',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Invalid or expired reset token' },
                error: { type: 'string', example: 'Bad Request' },
                statusCode: { type: 'number', example: 400 }
            }
        }
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded'
    })
    async resetPassword(
        @Body() resetPasswordDto: ResetPasswordDto,
        @Res() res
    ) {
        const result = await this.authService.resetPassword(resetPasswordDto.email, resetPasswordDto.token, resetPasswordDto.password);
        const refresh_token = result.tokens.refresh_token;
        res.cookie('refresh_token', refresh_token, this.getCookieOptions());
        
        return res.json({
            message: result.message,
            access_token: result.tokens.access_token,
        });
    }


    @Post('refresh')
    @ApiOperation({ 
        summary: 'Refresh access token',
        description: 'Generates a new access token using the refresh token from cookies'
    })
    @ApiOkResponse({ 
        description: 'Token refreshed successfully',
        schema: {
            type: 'object',
            properties: {
                access_token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
            }
        }
    })
    @ApiForbiddenResponse({ 
        description: 'Refresh token not found or invalid',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Refresh token not found' },
                error: { type: 'string', example: 'Forbidden' },
                statusCode: { type: 'number', example: 403 }
            }
        }
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded'
    })
    async refreshToken(@Req() req , @Res() res) {
        const refreshToken = req.cookies['refresh_token'];
        if (!refreshToken) {
            throw new ForbiddenException('Refresh token not found');
        }
        const tokens = await this.authService.refreshToken(refreshToken);
        res.cookie('refresh_token', tokens.refresh_token, this.getCookieOptions());
        return res.json({
            access_token: tokens.access_token,
        });
    }
    @Post('logout')
    @ApiOperation({ 
        summary: 'User logout',
        description: 'Logs out the authenticated user and clears the refresh token cookie'
    })
    @ApiOkResponse({ 
        description: 'Logout successful',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Logout successful' }
            }
        }
    })
    @ApiUnauthorizedResponse({ 
        description: 'User not authenticated',
        schema: {
            type: 'object',
            properties: {
                message: { type: 'string', example: 'Unauthorized' },
                error: { type: 'string', example: 'Unauthorized' },
                statusCode: { type: 'number', example: 401 }
            }
        }
    })
    @ApiTooManyRequestsResponse({ 
        description: 'Too many requests - rate limit exceeded'
    })
    async logout(@CurrentUser('id') id: string, @Res() res) {
        const result = await this.authService.logout(id);
        res.clearCookie('refresh_token', this.getCookieOptions());
        return res.json({
            message: result.message,
        });
    }
}
