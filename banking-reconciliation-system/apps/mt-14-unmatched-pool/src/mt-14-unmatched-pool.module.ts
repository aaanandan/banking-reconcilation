import { Module } from '@nestjs/common';
import { Mt14UnmatchedPoolController } from './mt-14-unmatched-pool.controller';
import { Mt14UnmatchedPoolService } from './mt-14-unmatched-pool.service';

@Module({
  imports: [],
  controllers: [Mt14UnmatchedPoolController],
  providers: [Mt14UnmatchedPoolService],
})
export class Mt14UnmatchedPoolModule {}
