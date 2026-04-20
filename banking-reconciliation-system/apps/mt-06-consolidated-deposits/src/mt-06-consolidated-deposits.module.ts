import { Module } from '@nestjs/common';
import { Mt06ConsolidatedDepositsController } from './mt-06-consolidated-deposits.controller';
import { Mt06ConsolidatedDepositsService } from './mt-06-consolidated-deposits.service';

@Module({
  imports: [],
  controllers: [Mt06ConsolidatedDepositsController],
  providers: [Mt06ConsolidatedDepositsService],
})
export class Mt06ConsolidatedDepositsModule {}
