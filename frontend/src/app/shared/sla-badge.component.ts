import { Component, Input, computed, signal } from '@angular/core';

@Component({
  selector: 'app-sla-badge',
  standalone: true,
  template: `
    <span class="badge" [class]="toneClass()">
      @if (days() === null) {
        n/a
      } @else if (days()! < 0) {
        Breached {{ -days()! }}d
      } @else {
        {{ days() }}d left
      }
    </span>
  `,
  styles: [`
    .badge {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 500; letter-spacing: 0.25px;
      border: 1px solid transparent;
    }
    .green { background: #e8f5e9; color: #1b5e20; border-color: #a5d6a7; }
    .amber { background: #fff8e1; color: #8d6e00; border-color: #ffe082; }
    .red   { background: #ffebee; color: #b71c1c; border-color: #ef9a9a; }
    .grey  { background: #f5f5f5; color: #555;   border-color: #ddd; }
  `]
})
export class SlaBadgeComponent {
  private _days = signal<number | null>(null);

  @Input() set daysRemaining(v: number | null | undefined) {
    this._days.set(v === undefined || v === null ? null : Math.trunc(v));
  }

  days = computed(() => this._days());
  toneClass = computed(() => {
    const d = this._days();
    if (d === null) return 'grey';
    if (d < 0 || d <= 3) return 'red';
    if (d <= 14) return 'amber';
    return 'green';
  });
}
