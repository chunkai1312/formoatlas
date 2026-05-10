import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BacktestingService } from './backtesting.service';
import { RunBacktestDto } from './dto/run-backtest.dto';

@ApiTags('backtesting')
@Controller('backtesting')
@UseGuards(JwtAuthGuard)
export class BacktestingController {
  constructor(private readonly backtestingService: BacktestingService) {}

  @ApiOperation({ summary: '執行會員限定單股回測' })
  @Post('run')
  run(@Body() body: RunBacktestDto) {
    return this.backtestingService.runBacktest(body);
  }
}
