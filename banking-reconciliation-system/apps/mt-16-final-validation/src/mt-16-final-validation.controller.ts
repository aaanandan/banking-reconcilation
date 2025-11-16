import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Mt16FinalValidationService } from './mt-16-final-validation.service';
import {
  ValidationRequestDto,
  ValidationResponseDto,
} from './dto/validation.dto';

/**
 * MT-16 Final Validation Controller
 * STEP 59: Safety Validator - Final validation endpoints
 */
@ApiTags('MT-16 Final Validation')
@Controller()
export class Mt16FinalValidationController {
  constructor(private readonly mt16Service: Mt16FinalValidationService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check for MT-16 service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  getHealth() {
    return {
      service: 'MT-16-Final-Validation',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      capabilities: [
        'safety-validation',
        'duplicate-detection',
        'confidence-review',
        'business-rule-validation',
      ],
    };
  }

  @Post('validate')
  @ApiOperation({
    summary: 'Validate matches before committing (CRITICAL)',
    description: `
      MT-16 Safety Validator: Critical checks before committing matches.

      Safety Checks:
      1. No credit-to-debit matches (sign mismatch)
      2. No duplicate matches (1 bank → 2+ ledgers)
      3. Amount sign consistency
      4. Date reasonableness (not future dates)
      5. Confidence threshold validation (>70%)

      Business Rules:
      1. All mandatory fields present

      Returns:
      - valid: true/false (false if critical issues found)
      - List of issues by severity (critical/warning/info)
      - Coverage statistics
      - Affected match indices for each issue
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed',
    type: ValidationResponseDto,
  })
  validateMatches(
    @Body() request: ValidationRequestDto,
  ): ValidationResponseDto {
    return this.mt16Service.validateMatches(request);
  }
}
