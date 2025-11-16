import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataPrepService } from './data-prep.service';

@ApiTags('Data Preparation')
@Controller('data-prep')
export class DataPrepController {
  constructor(private readonly dataPrepService: DataPrepService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for Data Prep Service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  healthCheck() {
    return {
      service: 'data-prep-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('analyze-multi-bank')
  @ApiOperation({ summary: 'Analyze multiple bank files and ledger' })
  @ApiResponse({ status: 200, description: 'Analysis complete' })
  async analyzeMultiBank(@Body() files: any) {
    // To be implemented in Step 11
    return { message: 'Multi-bank analysis - coming soon' };
  }

  @Post('validate-and-prepare')
  @ApiOperation({ summary: 'Validate and prepare data for reconciliation' })
  @ApiResponse({ status: 200, description: 'Data prepared successfully' })
  async validateAndPrepare(@Body() data: any) {
    // To be implemented in Step 12
    return { message: 'Data validation - coming soon' };
  }
}
