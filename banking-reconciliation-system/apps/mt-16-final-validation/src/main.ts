import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt16FinalValidationModule } from './mt-16-final-validation.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt16FinalValidationModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-16 Final Validation Service API')
    .setDescription(
      'Final validation service - Critical safety checks before committing matches (Safety Validator)',
    )
    .setVersion('1.0')
    .addTag('MT-16 Final Validation', 'Safety validation endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3011;
  await app.listen(port);

  console.log(`⚠️  MT-16 Final Validation Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
