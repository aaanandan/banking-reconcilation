import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt10CurrencyModule } from './mt-10-currency.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt10CurrencyModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('MT-10 Currency Conversion Service API')
    .setDescription(
      'Currency conversion detection service - Identifies transactions involving currency conversion (Exception Handler)',
    )
    .setVersion('1.0')
    .addTag('MT-10 Currency Conversion', 'Currency conversion detection endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3014;
  await app.listen(port);

  console.log(`💱 MT-10 Currency Conversion Service running on http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api`);
}
bootstrap();
