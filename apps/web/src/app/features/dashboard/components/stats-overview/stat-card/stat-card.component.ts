import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  label = input.required<string>();
  value = input<number | null>(null);
  change = input<number | null>(null);
  unit = input<string>('');
  decimals = input<number>(0);

  readonly isPositive = computed(() => (this.value() ?? 0) > 0);
  readonly isNegative = computed(() => (this.value() ?? 0) < 0);

  readonly formattedValue = computed(() => {
    const v = this.value();
    if (v == null) return '—';
    return v.toLocaleString('zh-TW', {
      minimumFractionDigits: this.decimals(),
      maximumFractionDigits: this.decimals(),
    });
  });

  readonly formattedChange = computed(() => {
    const c = this.change();
    if (c == null) return null;
    const prefix = c > 0 ? '+' : '';
    return `${prefix}${c.toLocaleString('zh-TW', {
      minimumFractionDigits: this.decimals(),
      maximumFractionDigits: this.decimals(),
    })}`;
  });
}
