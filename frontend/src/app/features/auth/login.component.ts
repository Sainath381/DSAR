import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule
  ],
  template: `
    <div class="login-wrap">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>DSAR Portal</mat-card-title>
          <mat-card-subtitle>Sign in to continue</mat-card-subtitle>
        </mat-card-header>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <mat-card-content>
            <mat-form-field appearance="outline" class="full">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" autocomplete="email" />
              <mat-error *ngIf="form.controls.email.hasError('required')">Email is required</mat-error>
              <mat-error *ngIf="form.controls.email.hasError('email')">Enter a valid email</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Password</mat-label>
              <input matInput [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password" autocomplete="current-password" />
              <button mat-icon-button matSuffix type="button"
                      (click)="showPassword.set(!showPassword())"
                      [attr.aria-label]="'Toggle password visibility'">
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.controls.password.hasError('required')">Password is required</mat-error>
            </mat-form-field>

            <p class="error" *ngIf="errorMsg()">{{ errorMsg() }}</p>
          </mat-card-content>

          <mat-card-actions align="end">
            <button mat-flat-button color="primary"
                    type="submit"
                    [disabled]="form.invalid || loading()">
              <mat-spinner *ngIf="loading()" diameter="18"></mat-spinner>
              <span *ngIf="!loading()">Sign in</span>
            </button>
          </mat-card-actions>
        </form>

        <mat-divider></mat-divider>
        <mat-card-content class="hint">
          <strong>Demo credentials</strong>
          <ul>
            <li><code>customer@demo.io</code> / <code>customer123</code></li>
            <li><code>admin@demo.io</code> / <code>admin123</code></li>
          </ul>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-wrap { min-height: 100vh; display:flex; justify-content:center; align-items:center;
                  padding:2rem; background:linear-gradient(135deg,#eef2ff 0%,#f7f5ff 100%); }
    .login-card { width: 100%; max-width: 420px; }
    .full { width: 100%; }
    .error { color: #b00020; margin: 0; }
    .hint { font-size: 0.85rem; color: #555; }
    .hint ul { margin: 0.25rem 0 0 1rem; padding: 0; }
    mat-spinner { display: inline-block; margin-right: 6px; vertical-align: middle; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal<string | null>(null);
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  submit(): void {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.errorMsg.set(null);
    this.auth.login(email, password).subscribe({
      next: (user) => {
        this.loading.set(false);
        this.router.navigateByUrl(user.role === 'ADMIN' ? '/admin' : '/customer');
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMsg.set(
          err?.status === 401
            ? 'Invalid email or password.'
            : err?.status === 0
              ? 'Backend unreachable. Is it running on port 8080?'
              : 'Login failed. Please try again.'
        );
      }
    });
  }
}
