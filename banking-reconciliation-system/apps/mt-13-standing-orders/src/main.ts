import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Mt13StandingOrdersModule } from './mt-13-standing-orders.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt13StandingOrdersModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = new DocumentBuilder()
    .setTitle('MT-13 Standing Orders Service API')
    .setDescription('Standing orders pattern matching service')
    .setVersion('1.0')
    .addTag('MT-13 Standing Orders')
    .build();

  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));

  const port = process.env.PORT ?? 3017;
  await app.listen(port);

  console.log(`🔁 MT-13 Standing Orders Service running on http://localhost:${port}`);
}
bootstrap();
