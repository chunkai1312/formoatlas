import { Type } from 'class-transformer';
import { IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { MarketResearchContextDto } from './market-research-query.dto';

export class CreateAgentConversationDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MarketResearchContextDto)
  context?: MarketResearchContextDto;
}
