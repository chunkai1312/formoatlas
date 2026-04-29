import { Component, input, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login-required-surface',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './login-required-surface.component.html',
  styleUrl: './login-required-surface.component.scss',
})
export class LoginRequiredSurfaceComponent {
  private readonly authService = inject(AuthService);

  readonly title = input('需要登入');
  readonly description = input('登入後可以使用自選股、保存研究對話，並讓市場助理根據你的追蹤清單提供盤後觀察。');

  login() {
    this.authService.login();
  }
}
