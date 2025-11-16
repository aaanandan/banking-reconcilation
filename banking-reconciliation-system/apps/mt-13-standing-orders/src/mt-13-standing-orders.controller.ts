import { Controller, Get } from '@nestjs/common';
import { Mt13StandingOrdersService } from './mt-13-standing-orders.service';

@Controller()
export class Mt13StandingOrdersController {
  constructor(private readonly mt13StandingOrdersService: Mt13StandingOrdersService) {}

  @Get()
  getHello(): string {
    return this.mt13StandingOrdersService.getHello();
  }
}
