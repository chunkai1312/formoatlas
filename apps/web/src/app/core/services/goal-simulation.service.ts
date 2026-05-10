import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { GoalSimulationResult, RunGoalSimulationRequest } from '../models/goal-simulation.model';

@Injectable({ providedIn: 'root' })
export class GoalSimulationService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/goal-simulation/run';

  run(request: RunGoalSimulationRequest): Observable<GoalSimulationResult> {
    return this.http.post<GoalSimulationResult>(this.baseUrl, request, { withCredentials: true });
  }
}
