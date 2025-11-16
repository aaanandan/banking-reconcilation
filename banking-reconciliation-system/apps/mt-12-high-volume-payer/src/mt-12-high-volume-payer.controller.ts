import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt12HighVolumePayerService } from './mt-12-high-volume-payer.service';
import {
  HighVolumeMatchingRequestDto,
  HighVolumeMatchingResponseDto,
} from './dto/matching.dto';

@ApiTags('MT-12 High-Volume Payer')
@Controller()
export class Mt12HighVolumePayerController {
  constructor(private readonly mt12Service: Mt12HighVolumePayerService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-12 service' })
  getHealth() {
    return {
      service: 'MT-12-High-Volume-Payer',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('find')
  @ApiOperation({ summary: 'Find high-volume payer groups' })
  @ApiResponse({ status: 200, type: HighVolumeMatchingResponseDto })
  findHighVolumePayers(@Body() request: HighVolumeMatchingRequestDto): HighVolumeMatchingResponseDto {
    return this.mt12Service.findHighVolumePayers(request);
  }
}
