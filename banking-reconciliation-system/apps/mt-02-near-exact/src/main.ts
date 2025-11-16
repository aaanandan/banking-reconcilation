import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt02NearExactModule } from './mt-02-near-exact.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt02NearExactModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Banking Reconciliation - MT-02 Near-Exact Match Service')
    .setDescription('Multi-bank reconciliation system - Fuzzy matching algorithm with tolerance for date, amount, and description variations')
    .setVersion('1.0')
    .addTag('Matching', 'Near-exact match transaction matching with fuzzy algorithms')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3004);
  console.log('MT-02 Near-Exact Match Service is running on port 3004');
  console.log('Swagger documentation available at http://localhost:3004/api');
}
bootstrap();
