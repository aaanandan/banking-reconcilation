import { Module } from '@nestjs/common';
import { Mt02NearExactController } from './mt-02-near-exact.controller';
import { Mt02NearExactService } from './mt-02-near-exact.service';

@Module({
  imports: [],
  controllers: [Mt02NearExactController],
  providers: [Mt02NearExactService],
})
export class Mt02NearExactModule {}
