import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
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

export class GoalSimulationUniverseDto {
  @ApiProperty({ description: '第一版僅支援單一股票', example: 'single-symbol', enum: ['single-symbol'] })
  @IsIn(['single-symbol'])
  type!: 'single-symbol';

  @ApiProperty({ description: '股票代號清單，第一版必須剛好一檔', example: ['2330'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1)
  @IsString({ each: true })
  @MaxLength(20, { each: true })
  symbols!: string[];
}

export class RunGoalSimulationDto {
  @ApiPropertyOptional({ description: '目標金額。若未提供，會由目標年化報酬率推估', example: 20_000_000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1_000_000_000_000)
  targetAmount?: number;

  @ApiPropertyOptional({ description: '目標年化報酬率。targetAmount 未提供時使用', example: 8, minimum: -99, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-99)
  @Max(100)
  targetAnnualReturnPct?: number;

  @ApiProperty({ description: '投資年限', example: 10, minimum: 1, maximum: 30 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(30)
  horizonYears!: number;

  @ApiPropertyOptional({ description: '歷史模擬開始日期 (YYYY-MM-DD)，未提供時由 endDate 往前 horizonYears', example: '2016-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '歷史模擬結束日期 (YYYY-MM-DD)，未提供時預設今日', example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: '初始本金', example: 1_000_000, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1_000_000_000_000)
  initialCapital!: number;

  @ApiProperty({ description: '每月投入金額', example: 30_000, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1_000_000_000_000)
  monthlyContribution!: number;

  @ApiPropertyOptional({ description: '最大回撤容忍度百分比', example: 20, minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  maxDrawdownTolerancePct?: number;

  @ApiProperty({ type: GoalSimulationUniverseDto })
  @IsObject()
  @ValidateNested()
  @Type(() => GoalSimulationUniverseDto)
  universe!: GoalSimulationUniverseDto;

}
