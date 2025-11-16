import { NestFactory } from '@nestjs/core';
import { Mt15ManualClassificationModule } from './mt-15-manual-classification.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt15ManualClassificationModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
