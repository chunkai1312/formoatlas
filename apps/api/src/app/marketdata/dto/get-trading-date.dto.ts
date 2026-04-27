import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class GetTradingDateDto {
  @ApiPropertyOptional({
    description: '查詢此日期當天或之前最近的交易日 (YYYY-MM-DD)，預設為今日',
    example: '2026-04-28',
  })
  @IsOptional()
  @IsDateString()
  before?: string;
}
