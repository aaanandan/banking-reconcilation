import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt06ConsolidatedDepositsModule } from './mt-06-consolidated-deposits.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt06ConsolidatedDepositsModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-06 Consolidated Deposits Service API')
    .setDescription(
      'Consolidated deposit matching service - Matches deposits from multiple banks to a single ledger entry (Multi-Bank Matcher)',
    )
    .setVersion('1.0')
    .addTag('MT-06 Consolidated Deposits', 'Multi-bank deposit matching endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3009;
  await app.listen(port);

  console.log(`🏦 MT-06 Consolidated Deposits Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
