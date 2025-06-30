import { Body, Controller, ForbiddenException, Logger, Patch, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { EmailDto } from '../users/dto/email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

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
    async register(@Body() createUserDto: CreateUserDto) {
        const user = await this.authService.register(createUserDto);
        return user;
    }
    @Post('login')
    async login(@Body() loginDto: LoginDto, @Res() res):Promise<{ access_token: string }> {
        const result = await this.authService.login(loginDto.email, loginDto.password);
        const refresh_token = result.tokens.refresh_token;
        res.cookie('refresh_token', refresh_token, this.getCookieOptions());
        return res.json({
        access_token: result.tokens.access_token,
    });
    }
    @Post('verify-email')
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
    async resendVerification(@Body() emailDto: EmailDto) {
        const result = await this.authService.resendVerificationEmail(emailDto.email);
        return result;
    }
    @Post('forgot-password')
    async forgotPassword(@Body() emailDto: EmailDto) {
        const result = await this.authService.sendResetPasswordEmail(emailDto.email);
        return result;
    }
    @Patch('reset-password')
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
    async logout(@CurrentUser('id') id: string, @Res() res) {
        const result = await this.authService.logout(id);
        res.clearCookie('refresh_token', this.getCookieOptions());
        return res.json({
            message: result.message,
        });
    }
}
