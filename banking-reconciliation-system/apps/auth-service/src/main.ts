import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth.module';
import helmet from 'helmet';
import {
  getCorsConfig,
  getHelmetConfig,
  getTrustedProxyConfig,
  additionalSecurityHeaders,
} from '@app/shared/config/security.config';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);

  // Get environment
  const environment = process.env.NODE_ENV || 'development';

  // Trust proxy (important for load balancers to get correct IP addresses)
  app.getHttpAdapter().getInstance().set('trust proxy', getTrustedProxyConfig());

  // Security headers with Helmet.js
  app.use(helmet(getHelmetConfig() as any)); // Type assertion for helmet config compatibility

  // Apply additional custom security headers
  app.use((req, res, next) => {
    Object.entries(additionalSecurityHeaders).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
    next();
  });

  // CORS configuration
  app.enableCors(getCorsConfig());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Disable detailed error messages in production
  if (environment === 'production') {
    app.useLogger(['error', 'warn']);
  }

  const port = process.env.AUTH_SERVICE_PORT || 3001;
  await app.listen(port);

  console.log(`🔐 Auth Service running on port ${port}`);
  console.log(`🌍 Environment: ${environment}`);
  console.log(`🛡️  Security headers enabled`);
  console.log(`🔒 CORS configured`);
}
bootstrap();
