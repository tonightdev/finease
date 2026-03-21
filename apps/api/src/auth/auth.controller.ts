import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, ResetPasswordDto } from './dto/auth.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import type { RequestWithUser } from '../common/interfaces/request.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user' })
  @Post('signup')
  signup(@Body() data: SignupDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.authService.signup(data, { userAgent, ipAddress });
  }

  @ApiOperation({ summary: 'Login and get a JWT token' })
  @Post('login')
  login(@Body() data: LoginDto, @Req() req: Request) {
    const userAgent = req.headers['user-agent'];
    const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip;
    return this.authService.login(data, { userAgent, ipAddress });
  }

  @ApiOperation({ summary: 'Reset user password' })
  @Post('reset-password')
  resetPassword(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }

  @ApiOperation({ summary: 'Logout and revoke JWT token' })
  @UseGuards(AuthGuard)
  @Post('logout')
  async logout(@Req() req: RequestWithUser) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (token) {
      await this.authService.logout(token);
    }
    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Get all active sessions for current user' })
  @UseGuards(AuthGuard)
  @Get('sessions')
  async getSessions(@Req() req: RequestWithUser) {
    return this.authService.getSessionsForUser(req.user.uid);
  }

  @ApiOperation({ summary: 'Revoke a specific session' })
  @UseGuards(AuthGuard)
  @Post('sessions/revoke')
  async revokeSession(
    @Req() req: RequestWithUser,
    @Body('token') targetToken: string,
  ) {
    return this.authService.revokeSession(req.user.uid, targetToken);
  }

}
