import { Type } from 'class-transformer';
import {
  IsDateString,
  IsBoolean,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { BacktestStrategy } from '../types/backtest-result.types';

export class BacktestParamsDto {
  @ApiProperty({ description: '短期 SMA 週期', example: 20, minimum: 2, maximum: 250 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(2)
  @Max(250)
  shortWindow?: number;

  @ApiProperty({ description: '長期 SMA 週期', example: 60, minimum: 3, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(3)
  @Max(500)
  longWindow?: number;

  @ApiProperty({ description: '交易股數。buy-and-hold 可省略，省略時以初始資金盡量買滿。', example: 100, minimum: 1, maximum: 1000000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1_000_000)
  orderSize?: number;
}

export class RunBacktestDto {
  @ApiProperty({ description: '股票代號', example: '2330' })
  @IsString()
  @MaxLength(20)
  symbol!: string;

  @ApiProperty({ description: '回測策略', example: 'sma-cross', enum: ['buy-and-hold', 'sma-cross'] })
  @IsIn(['buy-and-hold', 'sma-cross'])
  strategy!: BacktestStrategy;

  @ApiPropertyOptional({ description: '開始日期 (YYYY-MM-DD)，預設為結束日期往前 5 年', example: '2021-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '結束日期 (YYYY-MM-DD)，預設為今日', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '初始資金', example: 1_000_000, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1_000_000_000_000)
  initialCash!: number;

  @ApiPropertyOptional({ description: '手續費率，小數表示。例如 0.001425 = 0.1425%', example: 0.001425 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.1)
  feeRate?: number;

  @ApiPropertyOptional({ description: '證交稅率，小數表示。例如 0.003 = 0.3%', example: 0.003 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(0.1)
  taxRate?: number;

  @ApiPropertyOptional({ description: '是否以收盤價成交', example: true })
  @IsOptional()
  @IsBoolean()
  tradeOnClose?: boolean;

  @ApiPropertyOptional({ type: BacktestParamsDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => BacktestParamsDto)
  params?: BacktestParamsDto;
}
