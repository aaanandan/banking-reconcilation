import { Module } from '@nestjs/common';
import { Mt09TimingDifferencesController } from './mt-09-timing-differences.controller';
import { Mt09TimingDifferencesService } from './mt-09-timing-differences.service';

@Module({
  imports: [],
  controllers: [Mt09TimingDifferencesController],
  providers: [Mt09TimingDifferencesService],
})
export class Mt09TimingDifferencesModule {}
