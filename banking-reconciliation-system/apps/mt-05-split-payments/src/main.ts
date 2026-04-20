import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt05SplitPaymentsModule } from './mt-05-split-payments.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt05SplitPaymentsModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-05 Split Payments Service API')
    .setDescription(
      'Split payment matching service - Matches multiple bank transactions to a single ledger entry (Complex Matcher)',
    )
    .setVersion('1.0')
    .addTag('MT-05 Split Payments', 'Split payment matching endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3008;
  await app.listen(port);

  console.log(`💸 MT-05 Split Payments Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
