import { Component, inject } from '@angular/core';
import { LoginRequiredService } from '../../core/services/login-required.service';
import { LoginRequiredSurfaceComponent } from '../login-required-surface/login-required-surface.component';

@Component({
  selector: 'app-login-required-dialog',
  standalone: true,
  imports: [LoginRequiredSurfaceComponent],
  templateUrl: './login-required-dialog.component.html',
  styleUrl: './login-required-dialog.component.scss',
})
export class LoginRequiredDialogComponent {
  readonly loginRequired = inject(LoginRequiredService);
}
