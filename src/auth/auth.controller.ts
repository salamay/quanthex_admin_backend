import { Body, Controller, Post, Query, Request, UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    
    constructor(private authService: AuthService) { }

    @Post('login')
    async loginUser(@Request() req, @Body() loginBody): Promise<any> {
        if (!loginBody.email || !loginBody.password) {
            throw new UnprocessableEntityException('Email and password are required');
        }
        return await this.authService.signIn(loginBody);
    }
    
 
}
