import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    constructor() {
        super({
            session: false,
            secret: process.env.JWT_SECRET,
        });
    }

    async canActivate(context: ExecutionContext): Promise<any> {
        const request = context.switchToHttp().getRequest();
        //   console.log(request, 'request');
        const { url } = request;

        console.log(`Request URL: ${url}`);

        const exemptedRoutes = [
            '/adminapi/auth/signIn',
            '/adminapi/auth/register',
            '/adminapi/auth/login',
            /^\/sse\/.*/,
        ];

        const isExempted = exemptedRoutes.some((route) => {
            if (typeof route === 'string') {
                return url.startsWith(route);
            }

            if (route instanceof RegExp) {
                return route.test(url);
            }
            return false;
        });

        if (isExempted) {
            return true;
        }
        return super.canActivate(context);
    }
}