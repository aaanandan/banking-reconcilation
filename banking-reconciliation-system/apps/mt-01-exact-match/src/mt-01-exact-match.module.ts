import { Module } from '@nestjs/common';
import { Mt01ExactMatchController } from './mt-01-exact-match.controller';
import { Mt01ExactMatchService } from './mt-01-exact-match.service';

@Module({
  imports: [],
  controllers: [Mt01ExactMatchController],
  providers: [Mt01ExactMatchService],
})
export class Mt01ExactMatchModule {}
