import { Module } from '@nestjs/common';
import { Mt12HighVolumePayerController } from './mt-12-high-volume-payer.controller';
import { Mt12HighVolumePayerService } from './mt-12-high-volume-payer.service';

@Module({
  imports: [],
  controllers: [Mt12HighVolumePayerController],
  providers: [Mt12HighVolumePayerService],
})
export class Mt12HighVolumePayerModule {}
