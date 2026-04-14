import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt14UnmatchedPoolModule } from './mt-14-unmatched-pool.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt14UnmatchedPoolModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('MT-14 Unmatched Pool Service API')
    .setDescription('Unmatched transaction pool management service')
    .setVersion('1.0')
    .addTag('MT-14 Unmatched Pool')
    .build();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3018;
  await app.listen(port);

  console.log(`📝 MT-14 Unmatched Pool Service running on http://localhost:${port}`);
}
bootstrap();
