import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class GetTickerMetadataDto {
  @ApiProperty({
    description: '逗號分隔的股票代號清單',
    example: '2330,0050',
  })
  @IsString()
  @MaxLength(600)
  symbols: string;
}
