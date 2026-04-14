import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt09TimingDifferencesModule } from './mt-09-timing-differences.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt09TimingDifferencesModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-09 Timing Differences Service API')
    .setDescription(
      'Timing difference matching service - Handles date mismatches between bank and ledger (Date-Flexible Matcher)',
    )
    .setVersion('1.0')
    .addTag('MT-09 Timing Differences', 'Date-flexible matching endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3010;
  await app.listen(port);

  console.log(`⏰ MT-09 Timing Differences Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
