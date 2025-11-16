import { Controller, Get } from '@nestjs/common';
import { Mt15ManualClassificationService } from './mt-15-manual-classification.service';

@Controller()
export class Mt15ManualClassificationController {
  constructor(private readonly mt15ManualClassificationService: Mt15ManualClassificationService) {}

  @Get()
  getHello(): string {
    return this.mt15ManualClassificationService.getHello();
  }
}
