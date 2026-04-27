import { Type } from 'class-transformer';
import { IsIn, IsISO8601, IsObject, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class MarketResearchContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  route?: string;

  @IsOptional()
  @IsIn(['TSE', 'OTC'])
  market?: 'TSE' | 'OTC';

  @IsOptional()
  @IsString()
  @MaxLength(20)
  symbol?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sector?: string;
}

export class MarketResearchQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  question!: string;

  @IsISO8601({ strict: true })
  date!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MarketResearchContextDto)
  context?: MarketResearchContextDto;
}
