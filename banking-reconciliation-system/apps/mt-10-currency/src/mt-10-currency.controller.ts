import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt10CurrencyService } from './mt-10-currency.service';
import {
  CurrencyClassificationRequestDto,
  CurrencyClassificationResponseDto,
} from './dto/classification.dto';

/**
 * MT-10 Currency Conversion Controller
 * STEP 60.3: Exception Handler - Currency conversion detection endpoints
 */
@ApiTags('MT-10 Currency Conversion')
@Controller()
export class Mt10CurrencyController {
  constructor(private readonly mt10Service: Mt10CurrencyService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-10 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-10-Currency-Conversion',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'currency-conversion-detection',
        'exchange-rate-extraction',
        'multi-currency-support',
        'keyword-analysis',
      ],
    };
  }

  @Post('classify')
  @ApiOperation({
    summary: 'Classify currency conversion transactions',
    description: `
      MT-10 Exception Handler: Identifies bank transactions involving currency conversion.

      International transactions often involve currency conversion with exchange rate differences.

      Algorithm:
      1. Checks for currency keywords (conversion, exchange, FX, forex)
      2. Extracts currency codes (USD, EUR, GBP, INR, etc.)
      3. Detects exchange rate patterns
      4. Returns classification results

      Result: Reduces "unknown" transaction pool by identifying expected currency conversions.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Currency conversions classified successfully',
    type: CurrencyClassificationResponseDto,
  })
  classifyCurrencyConversions(
    @Body() request: CurrencyClassificationRequestDto,
  ): CurrencyClassificationResponseDto {
    return this.mt10Service.classifyCurrencyConversions(request);
  }
}
