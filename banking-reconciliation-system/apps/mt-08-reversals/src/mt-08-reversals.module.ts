import { Module } from '@nestjs/common';
import { Mt08ReversalsController } from './mt-08-reversals.controller';
import { Mt08ReversalsService } from './mt-08-reversals.service';

@Module({
  imports: [],
  controllers: [Mt08ReversalsController],
  providers: [Mt08ReversalsService],
})
export class Mt08ReversalsModule {}
