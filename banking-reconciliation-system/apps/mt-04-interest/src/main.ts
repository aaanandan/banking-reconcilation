import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt04InterestModule } from './mt-04-interest.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt04InterestModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-04 Interest Credits Service API')
    .setDescription(
      'Interest classification service - Identifies interest with NO ledger entry expected (Exception Handler)',
    )
    .setVersion('1.0')
    .addTag('MT-04 Interest Credits', 'Interest classification endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3007;
  await app.listen(port);

  console.log(`💵 MT-04 Interest Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
