import { Module } from '@nestjs/common';
import { Mt11RoundingController } from './mt-11-rounding.controller';
import { Mt11RoundingService } from './mt-11-rounding.service';

@Module({
  imports: [],
  controllers: [Mt11RoundingController],
  providers: [Mt11RoundingService],
})
export class Mt11RoundingModule {}
