import { Module } from '@nestjs/common';
import { DataPrepModule } from './data-prep.module';

@Module({
  imports: [DataPrepModule],
})
export class AppModule {}
