import { Module } from '@nestjs/common';
import { Mt07DuplicatePostingsController } from './mt-07-duplicate-postings.controller';
import { Mt07DuplicatePostingsService } from './mt-07-duplicate-postings.service';

@Module({
  imports: [],
  controllers: [Mt07DuplicatePostingsController],
  providers: [Mt07DuplicatePostingsService],
})
export class Mt07DuplicatePostingsModule {}
