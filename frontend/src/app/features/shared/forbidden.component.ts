import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule],
  template: `
    <div class="wrap">
      <mat-card>
        <mat-card-header>
          <mat-icon color="warn" style="font-size:48px;height:48px;width:48px;">block</mat-icon>
          <mat-card-title>Forbidden</mat-card-title>
          <mat-card-subtitle>Your role doesn't permit access to that section.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-actions>
          <button mat-flat-button color="primary" (click)="goHome()">Go to my dashboard</button>
          <button mat-stroked-button (click)="auth.logout()">Logout</button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .wrap { display:flex; justify-content:center; padding: 4rem 1rem; }
    mat-card { max-width: 480px; }
  `]
})
export class ForbiddenComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  goHome() {
    this.router.navigateByUrl(this.auth.role() === 'ADMIN' ? '/admin' : '/customer');
  }
}
