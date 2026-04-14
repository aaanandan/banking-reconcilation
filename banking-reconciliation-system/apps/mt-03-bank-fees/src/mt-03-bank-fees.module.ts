import { Module } from '@nestjs/common';
import { Mt03BankFeesController } from './mt-03-bank-fees.controller';
import { Mt03BankFeesService } from './mt-03-bank-fees.service';

@Module({
  imports: [],
  controllers: [Mt03BankFeesController],
  providers: [Mt03BankFeesService],
})
export class Mt03BankFeesModule {}
