import { Component, inject } from '@angular/core';
import { GlobalProgressService } from '../../core/services/global-progress.service';

@Component({
  selector: 'app-global-progress-bar',
  standalone: true,
  templateUrl: './global-progress-bar.component.html',
  styleUrl: './global-progress-bar.component.scss',
})
export class GlobalProgressBarComponent {
  protected readonly progress = inject(GlobalProgressService);
}
