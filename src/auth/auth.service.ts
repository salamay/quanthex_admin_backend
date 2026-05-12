import { ForbiddenException, Injectable, Logger, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from 'src/users/entities/user_entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
    logger = new Logger(AuthService.name);

    constructor(
        private jwtService: JwtService,
        private userService: UsersService,
    ) { }

    async signIn(payload: any): Promise<any> {
        const email = payload.email;
        const query = "SELECT * FROM users WHERE email = ?";
        const user: UserEntity = await this.userService.getProfileByEmail(email);
        if (user.reg_via === 'Basic') {
            const password = payload.password;
            if (user.password !== password) {
                throw new UnprocessableEntityException('Password is incorrect');
            }
        } else if (user.reg_via === 'Google') {
            // Google OAuth users don't require password verification
        } else {
            throw new UnprocessableEntityException('Invalid registration method: ' + user.reg_via);
        }
        const hasAdminRole = user.roles.split(',').includes('ROLE_ADMIN');
        if (!hasAdminRole) {
            throw new ForbiddenException('Admin access required');
        }
        return this.jwtService.sign({ uid: user.uid, email: user.email, roles: user.roles });

    }

}
