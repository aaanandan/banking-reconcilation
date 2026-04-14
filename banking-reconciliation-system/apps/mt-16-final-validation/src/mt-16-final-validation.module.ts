import { Module } from '@nestjs/common';
import { Mt16FinalValidationController } from './mt-16-final-validation.controller';
import { Mt16FinalValidationService } from './mt-16-final-validation.service';

@Module({
  imports: [],
  controllers: [Mt16FinalValidationController],
  providers: [Mt16FinalValidationService],
})
export class Mt16FinalValidationModule {}
