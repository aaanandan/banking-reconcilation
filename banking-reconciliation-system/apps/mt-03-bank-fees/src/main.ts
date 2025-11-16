import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt03BankFeesModule } from './mt-03-bank-fees.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt03BankFeesModule);

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('MT-03 Bank Fees & Charges Service API')
    .setDescription(
      'Bank fee classification service - Identifies bank fees with NO ledger entry expected (Exception Handler)',
    )
    .setVersion('1.0')
    .addTag('MT-03 Bank Fees & Charges', 'Bank fee classification endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3006;
  await app.listen(port);

  console.log(`💰 MT-03 Bank Fees Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
