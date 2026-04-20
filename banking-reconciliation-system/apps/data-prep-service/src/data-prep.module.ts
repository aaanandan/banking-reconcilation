import { Module } from '@nestjs/common';
import { SharedModule } from '@app/shared';
import { DataPrepController } from './data-prep.controller';
import { DataPrepService } from './data-prep.service';
import { ColumnDetectionService } from './services/column-detection.service';
import { DateRangeService } from './services/date-range.service';
import { AutoMappingService } from './services/auto-mapping.service';
import { DataNormalizationService } from './services/data-normalization.service';

@Module({
  imports: [SharedModule],
  controllers: [DataPrepController],
  providers: [
    DataPrepService,
    ColumnDetectionService,
    DateRangeService,
    AutoMappingService,
    DataNormalizationService,
  ],
  exports: [DataPrepService],
})
export class DataPrepModule {}
