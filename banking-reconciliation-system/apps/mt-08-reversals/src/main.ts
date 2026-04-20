import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt08ReversalsModule } from './mt-08-reversals.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt08ReversalsModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-08 Reversals & Corrections Service API')
    .setDescription(
      'Reversal detection service - Identifies reversals and corrections that cancel each other (Exception Handler)',
    )
    .setVersion('1.0')
    .addTag('MT-08 Reversals', 'Reversal pair detection endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3013;
  await app.listen(port);

  console.log(`🔄 MT-08 Reversals & Corrections Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
