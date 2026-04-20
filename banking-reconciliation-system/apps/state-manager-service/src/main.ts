import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { StateManagerServiceModule } from './state-manager-service.module';

async function bootstrap() {
  const app = await NestFactory.create(StateManagerServiceModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Banking Reconciliation - State Manager Service')
    .setDescription('Multi-bank reconciliation system - State persistence and transaction storage')
    .setVersion('1.0')
    .addTag('State Management', 'Reconciliation state, transaction storage, and snapshots')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3002);
  console.log('State Manager Service is running on port 3002');
  console.log('Swagger documentation available at http://localhost:3002/api');
}
bootstrap();
