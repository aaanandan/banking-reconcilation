import { Module } from '@nestjs/common';
import { Mt05SplitPaymentsController } from './mt-05-split-payments.controller';
import { Mt05SplitPaymentsService } from './mt-05-split-payments.service';

@Module({
  imports: [],
  controllers: [Mt05SplitPaymentsController],
  providers: [Mt05SplitPaymentsService],
})
export class Mt05SplitPaymentsModule {}
