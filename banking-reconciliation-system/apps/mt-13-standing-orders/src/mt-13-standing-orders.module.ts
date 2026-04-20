import { Module } from '@nestjs/common';
import { Mt13StandingOrdersController } from './mt-13-standing-orders.controller';
import { Mt13StandingOrdersService } from './mt-13-standing-orders.service';

@Module({
  imports: [],
  controllers: [Mt13StandingOrdersController],
  providers: [Mt13StandingOrdersService],
})
export class Mt13StandingOrdersModule {}
