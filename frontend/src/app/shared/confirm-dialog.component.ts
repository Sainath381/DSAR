import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose,
  MatDialogContent, MatDialogTitle
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title: string;
  message: string;
  warning?: string;
  confirmLabel?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  icon?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
    MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [color]="data.confirmColor || 'primary'">{{ data.icon || 'help_outline' }}</mat-icon>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      @if (data.warning) {
        <p class="warn">
          <mat-icon color="warn">warning</mat-icon>
          {{ data.warning }}
        </p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancel</button>
      <button mat-flat-button [color]="data.confirmColor || 'primary'" [mat-dialog-close]="true">
        {{ data.confirmLabel || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    h2 { display:flex; gap:.5rem; align-items:center; }
    .warn { background:#fff3e0; border:1px solid #ffcc80; padding:.5rem .75rem; border-radius:6px;
            color:#6d4c41; display:flex; gap:.5rem; align-items:flex-start; }
  `]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}
}
