import { Component, Input, computed, signal } from '@angular/core';
import { DsarStatus } from '../core/models';

@Component({
  selector: 'app-status-chip',
  standalone: true,
  template: `<span class="chip" [class]="tone()">{{ label() }}</span>`,
  styles: [`
    .chip {
      display: inline-block; padding: 2px 10px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600; letter-spacing: 0.25px;
      border: 1px solid transparent;
    }
    .submitted { background:#e3f2fd; color:#0d47a1; border-color:#90caf9; }
    .in-review { background:#ede7f6; color:#4527a0; border-color:#b39ddb; }
    .approved  { background:#e8f5e9; color:#1b5e20; border-color:#a5d6a7; }
    .rejected  { background:#ffebee; color:#b71c1c; border-color:#ef9a9a; }
    .completed { background:#e0f7fa; color:#006064; border-color:#80deea; }
    .unknown   { background:#f5f5f5; color:#555;    border-color:#ddd; }
  `]
})
export class StatusChipComponent {
  private _status = signal<DsarStatus | null>(null);

  @Input() set status(v: DsarStatus | null | undefined) {
    this._status.set(v ?? null);
  }

  label = computed(() => (this._status() ?? '').replace('_', ' '));
  tone = computed(() => {
    switch (this._status()) {
      case 'SUBMITTED': return 'submitted';
      case 'IN_REVIEW': return 'in-review';
      case 'APPROVED':  return 'approved';
      case 'REJECTED':  return 'rejected';
      case 'COMPLETED': return 'completed';
      default: return 'unknown';
    }
  });
}
