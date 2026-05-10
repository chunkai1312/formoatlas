import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RunGoalSimulationDto } from './dto/run-goal-simulation.dto';
import { GoalSimulationService } from './goal-simulation.service';

@ApiTags('goal-simulation')
@Controller('goal-simulation')
@UseGuards(JwtAuthGuard)
export class GoalSimulationController {
  constructor(private readonly goalSimulationService: GoalSimulationService) {}

  @ApiOperation({ summary: '執行會員限定目標報酬策略模擬' })
  @Post('run')
  run(@Body() body: RunGoalSimulationDto) {
    return this.goalSimulationService.run(body);
  }
}
