import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LearningServiceModule } from './learning-service.module';

async function bootstrap() {
  const app = await NestFactory.create(LearningServiceModule);

  // Enable validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Learning Service API')
    .setDescription('Banking Reconciliation Learning Service - Entity Profiles, User Feedback, Pattern Learning')
    .setVersion('1.0')
    .addTag('Learning', 'Entity profile and pattern learning operations')
    .addTag('Feedback', 'User feedback recording and analysis')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3004;
  await app.listen(port);
  console.log(`🎓 Learning Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
