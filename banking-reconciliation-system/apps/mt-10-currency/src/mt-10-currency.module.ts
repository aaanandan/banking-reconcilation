import { Module } from '@nestjs/common';
import { Mt10CurrencyController } from './mt-10-currency.controller';
import { Mt10CurrencyService } from './mt-10-currency.service';

@Module({
  imports: [],
  controllers: [Mt10CurrencyController],
  providers: [Mt10CurrencyService],
})
export class Mt10CurrencyModule {}
