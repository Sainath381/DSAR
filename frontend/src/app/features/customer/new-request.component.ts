import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestService } from '../../core/request.service';
import { DsarType } from '../../core/models';

@Component({
  selector: 'app-new-request',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatCheckboxModule, MatProgressSpinnerModule,
    MatRadioModule, MatSnackBarModule
  ],
  template: `
    <div class="wrap">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Submit a privacy request</mat-card-title>
          <mat-card-subtitle>
            Under GDPR Articles 15, 16 and 17 you may access, correct or delete your personal data.
          </mat-card-subtitle>
        </mat-card-header>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-card-content>
            <section class="type-section">
              <label class="section-label">Request type</label>
              <mat-radio-group formControlName="type" class="type-group">
                <mat-radio-button value="ACCESS">
                  <strong>Access</strong>
                  <small>Get a copy of all data we hold about you.</small>
                </mat-radio-button>
                <mat-radio-button value="CORRECT">
                  <strong>Correct</strong>
                  <small>Fix inaccurate personal details.</small>
                </mat-radio-button>
                <mat-radio-button value="DELETE">
                  <strong>Delete</strong>
                  <small>Erase your personal data (anonymized).</small>
                </mat-radio-button>
              </mat-radio-group>
            </section>

            @if (selectedType() === 'ACCESS') {
              <mat-form-field appearance="outline" class="full">
                <mat-label>Optional note</mat-label>
                <textarea matInput rows="3" formControlName="note"
                          placeholder="Any context you want to share with the reviewer"></textarea>
              </mat-form-field>
            }

            @if (selectedType() === 'CORRECT') {
              <p class="hint">Only <strong>Full Name</strong> may be corrected in this POC.</p>
              <mat-form-field appearance="outline" class="full">
                <mat-label>New full name</mat-label>
                <input matInput formControlName="newValue" />
                <mat-error *ngIf="form.controls.newValue.hasError('required')">Required</mat-error>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Reason (optional)</mat-label>
                <input matInput formControlName="note" />
              </mat-form-field>
            }

            @if (selectedType() === 'DELETE') {
              <div class="warn">
                <mat-icon color="warn">warning</mat-icon>
                <div>
                  <strong>This cannot be undone.</strong>
                  Once an admin approves, your name and email will be anonymized.
                  Your audit history is retained for compliance.
                </div>
              </div>
              <mat-checkbox formControlName="confirmed" color="primary">
                I understand and wish to proceed with deletion.
              </mat-checkbox>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Reason (optional)</mat-label>
                <input matInput formControlName="note" />
              </mat-form-field>
            }

            <p class="error" *ngIf="errorMsg()">{{ errorMsg() }}</p>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-button type="button" (click)="cancel()">Cancel</button>
            <button mat-flat-button color="primary" type="submit"
                    [disabled]="form.invalid || submitting()">
              @if (submitting()) {
                <mat-spinner diameter="18"></mat-spinner>&nbsp;Submitting…
              } @else {
                Submit request
              }
            </button>
          </mat-card-actions>
        </form>
      </mat-card>
    </div>
  `,
  styles: [`
    .wrap { max-width: 720px; }
    mat-card-title { font-size: 1.25rem; }
    .section-label { display:block; font-weight:500; margin-bottom:.5rem; color:#444; }
    .type-section { margin-bottom: 1.25rem; }
    .type-group { display:flex; flex-direction:column; gap:.5rem; }
    .type-group mat-radio-button { display:block; }
    .type-group small { display:block; color:#666; margin-left:.25rem; }
    .full { width: 100%; }
    .warn { display:flex; gap:.75rem; align-items:flex-start; padding:.75rem 1rem;
            background:#fff3e0; border:1px solid #ffcc80; border-radius:8px;
            margin: 0.75rem 0; }
    .warn strong { display:block; }
    .hint { color:#555; font-size:.9rem; margin:.5rem 0; }
    .error { color:#b00020; }
    mat-spinner { display:inline-block; vertical-align:middle; }
  `]
})
export class NewRequestComponent {
  private fb = inject(FormBuilder);
  private api = inject(RequestService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  submitting = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    type: ['ACCESS' as DsarType, [Validators.required]],
    note: [''],
    newValue: [''],
    confirmed: [false]
  });

  selectedType = (): DsarType => this.form.controls.type.value;

  constructor() {
    this.form.controls.type.valueChanges.subscribe(() => this.refreshValidators());
    this.refreshValidators();
  }

  private refreshValidators(): void {
    const t = this.form.controls.type.value;
    const nv = this.form.controls.newValue;
    const cf = this.form.controls.confirmed;
    nv.clearValidators();
    cf.clearValidators();
    if (t === 'CORRECT') {
      nv.addValidators([Validators.required, Validators.minLength(1)]);
    } else if (t === 'DELETE') {
      cf.addValidators(Validators.requiredTrue);
    }
    nv.updateValueAndValidity({ emitEvent: false });
    cf.updateValueAndValidity({ emitEvent: false });
  }

  submit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const body: { type: DsarType; note?: string; payload?: Record<string, unknown> } = {
      type: v.type
    };
    if (v.note && v.note.trim()) body.note = v.note.trim();
    if (v.type === 'CORRECT') {
      body.payload = { field: 'fullName', newValue: v.newValue.trim() };
    } else if (v.type === 'DELETE') {
      body.payload = { confirmed: true };
    }

    this.submitting.set(true);
    this.errorMsg.set(null);
    this.api.create(body).subscribe({
      next: () => {
        this.submitting.set(false);
        this.snack.open('Request submitted', 'OK', { duration: 2500 });
        this.router.navigateByUrl('/customer/requests');
      },
      error: (err) => {
        this.submitting.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Submission failed.');
      }
    });
  }

  cancel(): void {
    this.router.navigateByUrl('/customer/requests');
  }
}
