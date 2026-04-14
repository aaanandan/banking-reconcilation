import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt11RoundingModule } from './mt-11-rounding.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt11RoundingModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-11 Rounding Differences Service API')
    .setDescription(
      'Rounding difference detection service - Identifies small rounding discrepancies (Exception Handler)',
    )
    .setVersion('1.0')
    .addTag('MT-11 Rounding Differences', 'Rounding difference detection endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3015;
  await app.listen(port);

  console.log(`🔢 MT-11 Rounding Differences Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
