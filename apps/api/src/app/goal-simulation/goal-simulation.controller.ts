import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RunGoalSimulationDto } from './dto/run-goal-simulation.dto';
import { GoalSimulationService } from './goal-simulation.service';

@ApiTags('goal-simulation')
@Controller('goal-simulation')
export class GoalSimulationController {
  constructor(private readonly goalSimulationService: GoalSimulationService) {}

  @ApiOperation({ summary: '執行公開目標報酬策略模擬' })
  @Post('run')
  run(@Body() body: RunGoalSimulationDto) {
    return this.goalSimulationService.run(body);
  }
}
