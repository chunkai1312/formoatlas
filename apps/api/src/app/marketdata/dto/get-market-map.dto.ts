import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class GetMarketMapDto {
  @ApiPropertyOptional({
    description: '查詢日期 (YYYY-MM-DD)，預設為今日',
    example: '2026-04-27',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: '市場別（TSE 上市 / OTC 上櫃），預設 TSE',
    enum: ['TSE', 'OTC'],
    example: 'TSE',
  })
  @IsOptional()
  @IsIn(['TSE', 'OTC'])
  market?: 'TSE' | 'OTC';
}
