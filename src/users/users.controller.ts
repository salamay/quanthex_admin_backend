import { Controller, Get, Logger, Query, Request, UnauthorizedException } from '@nestjs/common';
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

    @Get('all')
    async getAllUsers(
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
        @Query('search') search?: string,
    ): Promise<any> {
        return await this.userService.getAllUsers(
            parseInt(offset),
            parseInt(limit),
            search,
        );
    }

    @Get('detail')
    async getUserDetail(@Query('uid') uid: string): Promise<any> {
        if (!uid) {
            throw new UnauthorizedException('Missing uid parameter');
        }
        return await this.userService.getUserDetail(uid);
    }

    @Get('user-referrals')
    async getUserReferrals(
        @Query('uid') uid: string,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
    ): Promise<any> {
        if (!uid) {
            throw new UnauthorizedException('Missing uid parameter');
        }
        return await this.userService.getUserReferrals(
            uid,
            parseInt(offset),
            parseInt(limit),
        );
    }

    @Get('user-subscriptions')
    async getUserSubscriptions(
        @Query('uid') uid: string,
        @Query('offset') offset: string = '0',
        @Query('limit') limit: string = '20',
    ): Promise<any> {
        if (!uid) {
            throw new UnauthorizedException('Missing uid parameter');
        }
        return await this.userService.getUserSubscriptions(
            uid,
            parseInt(offset),
            parseInt(limit),
        );
    }
}
