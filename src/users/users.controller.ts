import { Controller, Get, Logger, Request, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {

    logger = new Logger(UsersController.name);

    constructor(private userService: UsersService) {

    }

    @Get('profile')
    async getProfile(@Request() req): Promise<any> {
        const uid = req.user?.uid;
        console.log('Fetching profile for user:', uid);
        if (!uid) {
            throw new UnauthorizedException('Missing user id on request');
        }
        return await this.userService.getProfileByUid(uid);
    }
}
