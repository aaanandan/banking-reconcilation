import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Banking Reconciliation - Data Prep Service')
    .setDescription('Multi-bank reconciliation system - Data preparation and analysis service')
    .setVersion('1.0')
    .addTag('Data Preparation', 'CSV file analysis, column detection, and data normalization')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3001);
  console.log('Data Prep Service is running on port 3001');
  console.log('Swagger documentation available at http://localhost:3001/api');
}
bootstrap();
