import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt12HighVolumePayerModule } from './mt-12-high-volume-payer.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt12HighVolumePayerModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('MT-12 High-Volume Payer Service API')
    .setDescription('High-volume payer pattern matching service')
    .setVersion('1.0')
    .addTag('MT-12 High-Volume Payer')
    .build();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3016;
  await app.listen(port);

  console.log(`📊 MT-12 High-Volume Payer Service running on http://localhost:${port}`);
}
bootstrap();
