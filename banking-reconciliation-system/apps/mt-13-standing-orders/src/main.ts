import { NestFactory } from '@nestjs/core';
import { Mt13StandingOrdersModule } from './mt-13-standing-orders.module';

async function bootstrap() {
  const app = await NestFactory.create(Mt13StandingOrdersModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
