import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose,
  MatDialogContent, MatDialogRef, MatDialogTitle
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DsarStatus } from '../../core/models';

export interface TransitionDialogData {
  targetStatus: DsarStatus;
  currentStatus: DsarStatus;
  requesterLabel: string;
  requireNote: boolean;
}

export interface TransitionDialogResult {
  confirmed: boolean;
  note?: string;
}

@Component({
  selector: 'app-transition-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon [class]="iconClass">{{ icon }}</mat-icon>
      Confirm: {{ data.currentStatus }} → {{ data.targetStatus }}
    </h2>
    <form [formGroup]="form">
      <mat-dialog-content>
        <p>
          You're transitioning the request from
          <strong>{{ data.requesterLabel }}</strong>
          to <strong>{{ data.targetStatus }}</strong>.
        </p>
        @if (data.targetStatus === 'REJECTED') {
          <p class="warn">
            Rejection is terminal. The customer will need to submit a new request to try again.
          </p>
        }
        <mat-form-field appearance="outline" class="full">
          <mat-label>{{ data.requireNote ? 'Justification (required)' : 'Note (optional)' }}</mat-label>
          <textarea matInput rows="3" formControlName="note"></textarea>
          <mat-error *ngIf="form.controls['note'].hasError('required')">
            A justification is required when rejecting.
          </mat-error>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="button"
                [disabled]="form.invalid"
                (click)="confirm()">
          Confirm
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [`
    .full { width: 100%; }
    .warn { background:#fff3e0; border:1px solid #ffcc80; padding:.5rem .75rem; border-radius:6px; color:#6d4c41; }
    h2 mat-icon { vertical-align: middle; margin-right: .25rem; }
    .approve { color: #2e7d32; }
    .reject  { color: #b71c1c; }
    .review  { color: #4527a0; }
  `]
})
export class TransitionDialogComponent {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<TransitionDialogComponent, TransitionDialogResult>);

  form: FormGroup;
  icon: string;
  iconClass: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: TransitionDialogData) {
    this.form = this.fb.nonNullable.group({
      note: ['', data.requireNote ? [Validators.required, Validators.minLength(3)] : []]
    });
    this.icon =
      data.targetStatus === 'APPROVED' ? 'check_circle' :
      data.targetStatus === 'REJECTED' ? 'cancel' :
      data.targetStatus === 'IN_REVIEW' ? 'rate_review' :
      'swap_horiz';
    this.iconClass =
      data.targetStatus === 'APPROVED' ? 'approve' :
      data.targetStatus === 'REJECTED' ? 'reject' :
      'review';
  }

  confirm(): void {
    if (this.form.invalid) return;
    const note = (this.form.getRawValue() as { note: string }).note;
    this.ref.close({ confirmed: true, note: note?.trim() ? note.trim() : undefined });
  }
}
