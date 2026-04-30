import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetStockSummaryDto {
  @ApiProperty({
    description: '股票代號',
    example: '2330',
  })
  @IsNotEmpty()
  @IsString()
  symbol: string;

  @ApiPropertyOptional({
    description: '查詢日期 (YYYY-MM-DD)，預設為今日',
    example: '2026-04-30',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
