import { Module } from '@nestjs/common';
import { Mt15ManualClassificationController } from './mt-15-manual-classification.controller';
import { Mt15ManualClassificationService } from './mt-15-manual-classification.service';

@Module({
  imports: [],
  controllers: [Mt15ManualClassificationController],
  providers: [Mt15ManualClassificationService],
})
export class Mt15ManualClassificationModule {}
