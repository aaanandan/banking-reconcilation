import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt15ManualClassificationModule } from './mt-15-manual-classification.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt15ManualClassificationModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('MT-15 Manual Classification Service API')
    .setDescription('Manual transaction classification service')
    .setVersion('1.0')
    .addTag('MT-15 Manual Classification')
    .build();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3019;
  await app.listen(port);

  console.log(`👤 MT-15 Manual Classification Service running on http://localhost:${port}`);
}
bootstrap();
