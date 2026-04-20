import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt07DuplicatePostingsModule } from './mt-07-duplicate-postings.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt07DuplicatePostingsModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-07 Duplicate Postings Service API')
    .setDescription(
      'Duplicate detection service - Identifies duplicate bank transactions (Exception Handler)',
    )
    .setVersion('1.0')
    .addTag('MT-07 Duplicate Postings', 'Duplicate detection endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3012;
  await app.listen(port);

  console.log(`🔄 MT-07 Duplicate Postings Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
