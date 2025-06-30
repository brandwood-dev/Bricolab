import { Body, Controller, ForbiddenException, Logger, Patch, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import path from 'path';

@Controller('auth')
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
    // works
    @Post('register')
    async register(@Body() createUserDto: CreateUserDto) {
        const user = await this.authService.register(createUserDto);
        return user;
    }
    // works
    @Post('login')
    async login(@Body('email') email: string, @Body('password') password: string, @Res() res):Promise<{ access_token: string }> {
        const result = await this.authService.login(email, password);
        const refresh_token = result.tokens.refresh_token;
        res.cookie('refresh_token', refresh_token, this.getCookieOptions());
        return res.json({
        access_token: result.tokens.access_token,
    });
    }
    //works
    @Post('verify-email')
    async verifyEmail(@Body('token') token: string, @Body('email') email: string, @Res() res) {
        const result = await this.authService.verifyEmail(token, email);
        const refresh_token = result.tokens.refresh_token;
        res.cookie('refresh_token', refresh_token, this.getCookieOptions());
        return res.json({
            message: result.message,
            access_token: result.tokens.access_token,
        });
    }
    // works
    @Post('resend-verification')
    async resendVerification(@Body('email') email: string) {
        this.logger.debug(`Resending verification email to: ${email}`);
        const result = await this.authService.resendVerificationEmail(email);
        return result;
    }
    @Post('forgot-password')
    async forgotPassword(@Body('email') email: string) {
        const result = await this.authService.sendResetPasswordEmail(email);
        return result;
    }
    @Patch('reset-password')
    async resetPassword(
        @Body('token') token: string, 
        @Body('email') email: string, 
        @Body('newPassword') newPassword: string,
        @Res() res
    ) {
        const result = await this.authService.resetPassword(token, email, newPassword);
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
}
