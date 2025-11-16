import {
  Controller,
  Post,
  Body,
  Get,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { DataPrepService } from './data-prep.service';
import { MultiFilesAnalysisResponseDto } from '@app/shared';

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

  /**
   * Step 11: Multi-file upload endpoint
   * Accepts multiple bank CSV files + 1 ledger CSV file
   * Returns comprehensive analysis with column detection, date ranges, and auto-mappings
   */
  @Post('analyze-multi-bank')
  @ApiOperation({
    summary: 'Analyze multiple bank files and ledger',
    description:
      'Upload multiple bank CSV files and one ledger CSV file. Returns comprehensive analysis including column detection, date ranges, and auto-generated mappings for each file.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        bankFiles: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Multiple bank CSV files (e.g., HDFC.csv, ICICI.csv, SBI.csv)',
        },
        ledgerFile: {
          type: 'string',
          format: 'binary',
          description: 'Ledger CSV file',
        },
      },
      required: ['bankFiles', 'ledgerFile'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Analysis complete',
    type: MultiFilesAnalysisResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file upload or missing files' })
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'bankFiles', maxCount: 10 }, // Support up to 10 bank files
      { name: 'ledgerFile', maxCount: 1 },
    ]),
  )
  async analyzeMultiBank(
    @UploadedFiles()
    files: {
      bankFiles?: Express.Multer.File[];
      ledgerFile?: Express.Multer.File[];
    },
  ): Promise<MultiFilesAnalysisResponseDto> {
    // Validate file uploads
    if (!files.bankFiles || files.bankFiles.length === 0) {
      throw new BadRequestException('At least one bank file is required');
    }

    if (!files.ledgerFile || files.ledgerFile.length === 0) {
      throw new BadRequestException('Ledger file is required');
    }

    // Validate file types (must be CSV)
    const allFiles = [...files.bankFiles, ...files.ledgerFile];
    for (const file of allFiles) {
      if (!file.originalname.toLowerCase().endsWith('.csv')) {
        throw new BadRequestException(`File ${file.originalname} must be a CSV file`);
      }
    }

    return this.dataPrepService.analyzeMultiBankFiles(files.bankFiles, files.ledgerFile[0]);
  }

  @Post('validate-and-prepare')
  @ApiOperation({ summary: 'Validate and prepare data for reconciliation' })
  @ApiResponse({ status: 200, description: 'Data prepared successfully' })
  async validateAndPrepare(@Body() data: any) {
    // To be implemented in Step 12
    return { message: 'Data validation - coming soon' };
  }
}
