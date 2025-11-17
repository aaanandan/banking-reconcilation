import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt15ManualClassificationService } from './mt-15-manual-classification.service';
import { ManualClassificationRequestDto, ManualClassificationResponseDto } from './dto/classification.dto';
import { TenantContext } from '@app/shared';

@ApiTags('MT-15 Manual Classification')
@Controller()
export class Mt15ManualClassificationController {
  constructor(private readonly mt15Service: Mt15ManualClassificationService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-15 service' })
  getHealth() {
    return { service: 'MT-15-Manual-Classification', status: 'healthy', timestamp: new Date().toISOString() };
  }

  @Post('classify')
  @ApiOperation({ summary: 'Manually classify a transaction' })
  @ApiResponse({ status: 200, type: ManualClassificationResponseDto })
  classifyManually(
    @TenantContext() tenantContext: { tenantId: string; userId: string; role: string },
    @Body() request: ManualClassificationRequestDto,
  ): ManualClassificationResponseDto {
    return this.mt15Service.classifyManually(tenantContext, request);
  }
}
