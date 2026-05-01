import { Global, Module } from '@nestjs/common';
import { CopilotRuntimeService } from './copilot-runtime.service';
import { CopilotSessionLockService } from './copilot-session-lock.service';

@Global()
@Module({
  providers: [CopilotRuntimeService, CopilotSessionLockService],
  exports: [CopilotRuntimeService, CopilotSessionLockService],
})
export class CopilotRuntimeModule {}
