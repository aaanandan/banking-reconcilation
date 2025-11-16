import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { QuestionManagerServiceModule } from './question-manager-service.module';

async function bootstrap() {
  const app = await NestFactory.create(QuestionManagerServiceModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Question Manager Service API')
    .setDescription(
      'Banking Reconciliation Question Manager - Learning question generation, queueing, and answer processing',
    )
    .setVersion('1.0')
    .addTag('Questions', 'Question management and queueing operations')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  console.log(`❓ Question Manager Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
