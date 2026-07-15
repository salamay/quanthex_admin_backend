import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MyInterceptorsInterceptor } from './interceptors/my_interceptors.interceptor';
import { JwtAuthGuard } from './jwt/jwt_auth_guard';

async function bootstrap() {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const app = await NestFactory.create(AppModule);

  // 2. Grab the raw string from .env
  const rawOrigins = process.env.ORIGIN;

  // 3. Convert the string into a clean array of URLs
  const allowedOrigins = rawOrigins
    ? rawOrigins.split(',').map((origin) => origin.trim())
    : [];
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  });
  app.setGlobalPrefix('adminapi');
  app.useGlobalGuards(new JwtAuthGuard());
  app.useGlobalInterceptors(new MyInterceptorsInterceptor());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
