import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt14UnmatchedPoolService } from './mt-14-unmatched-pool.service';
import { UnmatchedPoolRequestDto, UnmatchedPoolResponseDto } from './dto/pool.dto';

@ApiTags('MT-14 Unmatched Pool')
@Controller()
export class Mt14UnmatchedPoolController {
  constructor(private readonly mt14Service: Mt14UnmatchedPoolService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-14 service' })
  getHealth() {
    return { service: 'MT-14-Unmatched-Pool', status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Post('pool')
  @ApiOperation({ summary: 'Get unmatched transaction pool' })
  @ApiResponse({ status: 200, type: UnmatchedPoolResponseDto })
  getUnmatchedPool(@Body() request: UnmatchedPoolRequestDto): UnmatchedPoolResponseDto {
    return this.mt14Service.getUnmatchedPool(request);
  }
}
