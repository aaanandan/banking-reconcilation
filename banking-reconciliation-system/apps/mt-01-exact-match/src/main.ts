import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt01ExactMatchModule } from './mt-01-exact-match.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt01ExactMatchModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Banking Reconciliation - MT-01 Exact Match Service')
    .setDescription('Multi-bank reconciliation system - Exact match algorithm for transaction matching')
    .setVersion('1.0')
    .addTag('Matching', 'Exact match transaction matching algorithm')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3003);
  console.log('MT-01 Exact Match Service is running on port 3003');
  console.log('Swagger documentation available at http://localhost:3003/api');
}
bootstrap();
