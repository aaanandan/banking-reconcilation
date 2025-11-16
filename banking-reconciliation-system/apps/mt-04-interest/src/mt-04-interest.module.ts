import { Module } from '@nestjs/common';
import { Mt04InterestController } from './mt-04-interest.controller';
import { Mt04InterestService } from './mt-04-interest.service';

@Module({
  imports: [],
  controllers: [Mt04InterestController],
  providers: [Mt04InterestService],
})
export class Mt04InterestModule {}
