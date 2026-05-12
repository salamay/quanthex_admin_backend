import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class MyInterceptorsInterceptor implements NestInterceptor {
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
      return next.handle().pipe(
      map((data) => {
        const statusCode = context.switchToHttp().getResponse().statusCode;
        return {
          status: statusCode >= 200 && statusCode <300 ? true : false,
          message: data?.message || 'Request successful',
          timestamp: new Date().toISOString(),
          total: data?.total || (Array.isArray(data?.data) ? data.data.length : 1),
          planNames: data?.planNames || undefined,
          data: data?.data || data,
        };
      }),
    );
  }
}
