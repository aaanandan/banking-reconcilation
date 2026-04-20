import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, IsBoolean } from 'class-validator';
import { TransactionDto } from '@app/shared';

/**
 * Currency conversion classification for a single transaction
 */
export class CurrencyClassificationDto {
  @ApiProperty({ description: 'Bank transaction ID' })
  @IsNumber()
  bankTxnId: number;

  @ApiProperty({ description: 'Classified as currency conversion' })
  @IsBoolean()
  isCurrencyConversion: boolean;

  @ApiProperty({ description: 'Detected source currency' })
  @IsString()
  sourceCurrency: string;

  @ApiProperty({ description: 'Detected target currency' })
  @IsString()
  targetCurrency: string;

  @ApiProperty({ description: 'Original amount in source currency' })
  @IsNumber()
  sourceAmount: number;

  @ApiProperty({ description: 'Converted amount in target currency' })
  @IsNumber()
  targetAmount: number;

  @ApiProperty({ description: 'Exchange rate used' })
  @IsNumber()
  exchangeRate: number;

  @ApiProperty({ description: 'Confidence score (0.0 to 1.0)' })
  @IsNumber()
  confidence: number;

  @ApiProperty({ description: 'Reasoning for classification' })
  @IsString()
  reasoning: string;

  @ApiProperty({ description: 'Algorithm used for detection' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Bank ID' })
  @IsString()
  bankId: string;
}

/**
 * Currency conversion classification request
 */
export class CurrencyClassificationRequestDto {
  @ApiProperty({
    description: 'Bank transactions to classify for currency conversion',
    type: [TransactionDto],
  })
  @IsArray()
  bankTransactions: TransactionDto[];
}

/**
 * Currency conversion classification response
 */
export class CurrencyClassificationResponseDto {
  @ApiProperty({
    description: 'Currency conversion classifications',
    type: [CurrencyClassificationDto],
  })
  classifications: CurrencyClassificationDto[];

  @ApiProperty({ description: 'Total currency conversion transactions found' })
  @IsNumber()
  totalCurrencyConversions: number;

  @ApiProperty({ description: 'Algorithm used' })
  @IsString()
  algorithm: string;

  @ApiProperty({ description: 'Timestamp of classification' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalProcessed: number;
    currencyConversionsFound: number;
    uniqueCurrencies: string[];
  };
}
