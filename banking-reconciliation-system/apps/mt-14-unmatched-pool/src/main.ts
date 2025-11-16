import { NestFactory } from '@nestjs/core';
import { Mt14UnmatchedPoolModule } from './mt-14-unmatched-pool.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt14UnmatchedPoolModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
