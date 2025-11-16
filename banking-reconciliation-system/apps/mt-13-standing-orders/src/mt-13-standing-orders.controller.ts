import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt13StandingOrdersService } from './mt-13-standing-orders.service';
import {
  StandingOrderMatchingRequestDto,
  StandingOrderMatchingResponseDto,
} from './dto/matching.dto';

@ApiTags('MT-13 Standing Orders')
@Controller()
export class Mt13StandingOrdersController {
  constructor(private readonly mt13Service: Mt13StandingOrdersService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-13 service' })
  getHealth() {
    return { service: 'MT-13-Standing-Orders', status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Post('find')
  @ApiOperation({ summary: 'Find standing order patterns' })
  @ApiResponse({ status: 200, type: StandingOrderMatchingResponseDto })
  findStandingOrders(@Body() request: StandingOrderMatchingRequestDto): StandingOrderMatchingResponseDto {
    return this.mt13Service.findStandingOrders(request);
  }
}
