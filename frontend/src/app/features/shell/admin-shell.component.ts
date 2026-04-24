import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [
    CommonModule, RouterLink, RouterLinkActive, RouterOutlet,
    MatToolbarModule, MatButtonModule, MatIconModule, MatSidenavModule, MatListModule
  ],
  template: `
    <mat-toolbar color="primary" class="top">
      <mat-icon>admin_panel_settings</mat-icon>
      <span class="brand">DSAR Portal</span>
      <span class="badge">Admin</span>
      <span class="spacer"></span>
      <span class="whoami">{{ auth.user()?.fullName }} &lt;{{ auth.user()?.email }}&gt;</span>
      <button mat-stroked-button color="accent" (click)="auth.logout()">
        <mat-icon>logout</mat-icon>&nbsp;Logout
      </button>
    </mat-toolbar>

    <div class="layout">
      <nav class="side">
        <mat-nav-list>
          <a mat-list-item routerLink="/admin/queue" routerLinkActive="active">
            <mat-icon matListItemIcon>assignment</mat-icon>
            <span matListItemTitle>Request Queue</span>
          </a>
          <a mat-list-item routerLink="/admin/audit" routerLinkActive="active">
            <mat-icon matListItemIcon>history</mat-icon>
            <span matListItemTitle>Audit Log</span>
          </a>
        </mat-nav-list>
      </nav>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .top { gap: .5rem; }
    .brand { font-weight: 600; margin-left: .25rem; }
    .badge { background: rgba(255,255,255,.25); padding: 2px 10px; border-radius: 999px; font-size: .75rem; margin-left: .5rem; }
    .spacer { flex: 1; }
    .whoami { font-size: .85rem; opacity: .9; margin-right: .75rem; }
    .layout { display: grid; grid-template-columns: 240px 1fr; min-height: calc(100vh - 64px); }
    .side { border-right: 1px solid #e0e0e0; background: #fafafa; }
    .content { padding: 1.5rem; }
    .active { background: rgba(63,81,181,0.12) !important; }
  `]
})
export class AdminShellComponent {
  auth = inject(AuthService);
}
