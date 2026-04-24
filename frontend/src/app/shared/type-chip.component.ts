import { Component, Input, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DsarType } from '../core/models';

@Component({
  selector: 'app-type-chip',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <span class="chip" [class]="tone()">
      <mat-icon class="icon">{{ icon() }}</mat-icon>
      {{ label() }}
    </span>
  `,
  styles: [`
    .chip {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 10px; border-radius: 999px;
      font-size: 0.75rem; font-weight: 600;
      border: 1px solid transparent;
    }
    .icon { font-size: 14px; width: 14px; height: 14px; }
    .access  { background:#e3f2fd; color:#0d47a1; border-color:#90caf9; }
    .delete  { background:#ffebee; color:#b71c1c; border-color:#ef9a9a; }
    .correct { background:#fff8e1; color:#8d6e00; border-color:#ffe082; }
  `]
})
export class TypeChipComponent {
  private _type = signal<DsarType | null>(null);

  @Input() set type(v: DsarType | null | undefined) {
    this._type.set(v ?? null);
  }

  label = computed(() => this._type() ?? '');
  icon = computed(() => {
    switch (this._type()) {
      case 'ACCESS':  return 'visibility';
      case 'DELETE':  return 'delete';
      case 'CORRECT': return 'edit';
      default: return 'help_outline';
    }
  });
  tone = computed(() => (this._type() ?? '').toLowerCase());
}
