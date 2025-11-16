import { Controller, Get } from '@nestjs/common';
import { Mt14UnmatchedPoolService } from './mt-14-unmatched-pool.service';

@Controller()
export class Mt14UnmatchedPoolController {
  constructor(private readonly mt14UnmatchedPoolService: Mt14UnmatchedPoolService) {}

  @Get()
  getHello(): string {
    return this.mt14UnmatchedPoolService.getHello();
  }
}
