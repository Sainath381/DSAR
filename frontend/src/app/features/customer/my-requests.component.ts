import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RequestService } from '../../core/request.service';
import { DsarRequest } from '../../core/models';
import { SlaBadgeComponent } from '../../shared/sla-badge.component';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { TypeChipComponent } from '../../shared/type-chip.component';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatSnackBarModule,
    SlaBadgeComponent, StatusChipComponent, TypeChipComponent
  ],
  template: `
    <div class="header">
      <div>
        <h1>My Requests</h1>
        <p class="sub">Your privacy requests. Status updates in real time once admins act.</p>
      </div>
      <a mat-flat-button color="primary" routerLink="/customer/new">
        <mat-icon>add</mat-icon>&nbsp;New request
      </a>
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (error()) {
      <mat-card class="error">
        <mat-card-content>
          <mat-icon color="warn">error_outline</mat-icon> {{ error() }}
        </mat-card-content>
      </mat-card>
    } @else if (rows().length === 0) {
      <mat-card class="empty">
        <mat-card-content>
          <mat-icon>inbox</mat-icon>
          <p>You haven't submitted any requests yet.</p>
          <a mat-flat-button color="primary" routerLink="/customer/new">
            Submit your first request
          </a>
        </mat-card-content>
      </mat-card>
    } @else {
      <mat-card class="table-card">
        <table mat-table [dataSource]="rows()">
          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let r">
              <app-type-chip [type]="r.type"></app-type-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r">
              <app-status-chip [status]="r.status"></app-status-chip>
            </td>
          </ng-container>

          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Submitted</th>
            <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'mediumDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="sla">
            <th mat-header-cell *matHeaderCellDef>SLA</th>
            <td mat-cell *matCellDef="let r"
                [matTooltip]="'Due: ' + (r.slaDueAt | date:'medium')">
              <app-sla-badge [daysRemaining]="r.daysRemaining"></app-sla-badge>
            </td>
          </ng-container>

          <ng-container matColumnDef="note">
            <th mat-header-cell *matHeaderCellDef>Note</th>
            <td mat-cell *matCellDef="let r" class="note">
              {{ noteOf(r) }}
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              @if (r.type === 'ACCESS' && r.status === 'COMPLETED') {
                <button mat-stroked-button color="primary"
                        (click)="download(r)"
                        [disabled]="downloading() === r.id">
                  <mat-icon>cloud_download</mat-icon>
                  @if (downloading() === r.id) { &nbsp;Downloading… }
                  @else { &nbsp;Export }
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols"></tr>
        </table>
      </mat-card>
    }
  `,
  styles: [`
    .header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem; }
    h1 { margin: 0; font-size: 1.5rem; }
    .sub { margin: 0.25rem 0 0 0; color: #555; }
    .center { display:flex; justify-content:center; padding: 3rem 1rem; }
    .error mat-icon { vertical-align: middle; margin-right: 6px; }
    .empty { text-align: center; }
    .empty mat-icon { font-size:48px; height:48px; width:48px; opacity:.5; }
    .table-card { overflow:auto; }
    table { width: 100%; }
    td.note { max-width: 240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#666; }
  `]
})
export class MyRequestsComponent implements OnInit {
  private api = inject(RequestService);
  private snack = inject(MatSnackBar);

  rows = signal<DsarRequest[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  downloading = signal<string | null>(null);

  readonly cols = ['type', 'status', 'created', 'sla', 'note', 'actions'];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listMine().subscribe({
      next: (rows) => { this.rows.set(rows); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not load requests');
        this.loading.set(false);
      }
    });
  }

  download(r: DsarRequest): void {
    this.downloading.set(r.id);
    this.api.downloadExport(r.id).subscribe({
      next: (blob) => {
        this.downloading.set(null);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dsar-export-${r.id}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        this.snack.open('Export downloaded', 'OK', { duration: 2500 });
      },
      error: (err) => {
        this.downloading.set(null);
        this.snack.open(err?.error?.message ?? 'Download failed', 'Dismiss', { duration: 4000 });
      }
    });
  }

  noteOf(r: DsarRequest): string {
    const p = r.payload as Record<string, unknown> | undefined;
    if (!p) return '';
    if (typeof p['note'] === 'string') return p['note'] as string;
    if (r.type === 'CORRECT') return `${p['field']} → ${p['newValue']}`;
    if (r.type === 'DELETE') return p['confirmed'] ? 'Confirmed' : '';
    return '';
  }
}
