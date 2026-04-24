import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminRequestService } from '../../core/admin-request.service';
import { DsarRequest, DsarStatus, DsarType } from '../../core/models';
import { SlaBadgeComponent } from '../../shared/sla-badge.component';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { TypeChipComponent } from '../../shared/type-chip.component';

@Component({
  selector: 'app-admin-queue',
  standalone: true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule,
    MatCardModule, MatTableModule, MatFormFieldModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatTooltipModule,
    SlaBadgeComponent, StatusChipComponent, TypeChipComponent
  ],
  template: `
    <div class="header">
      <div>
        <h1>Request queue</h1>
        <p class="sub">Sorted by SLA urgency. Click a row to review and act.</p>
      </div>
      <div class="counters">
        <span class="counter" matTooltip="Total matching filters">
          <mat-icon>assignment</mat-icon> {{ total() }}
        </span>
      </div>
    </div>

    <mat-card class="filter-card">
      <form [formGroup]="filters" (change)="load()" class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Type</mat-label>
          <mat-select formControlName="type">
            <mat-option [value]="null">All</mat-option>
            <mat-option value="ACCESS">Access</mat-option>
            <mat-option value="DELETE">Delete</mat-option>
            <mat-option value="CORRECT">Correct</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select formControlName="status">
            <mat-option [value]="null">All</mat-option>
            <mat-option value="SUBMITTED">Submitted</mat-option>
            <mat-option value="IN_REVIEW">In review</mat-option>
            <mat-option value="APPROVED">Approved</mat-option>
            <mat-option value="REJECTED">Rejected</mat-option>
            <mat-option value="COMPLETED">Completed</mat-option>
          </mat-select>
        </mat-form-field>

        <button mat-stroked-button type="button" (click)="clearFilters()">
          <mat-icon>clear</mat-icon>&nbsp;Clear
        </button>
        <button mat-stroked-button type="button" (click)="load()">
          <mat-icon>refresh</mat-icon>&nbsp;Refresh
        </button>
      </form>
    </mat-card>

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
          <p>No requests match your filters.</p>
        </mat-card-content>
      </mat-card>
    } @else {
      <mat-card class="table-card">
        <table mat-table [dataSource]="rows()">
          <ng-container matColumnDef="requester">
            <th mat-header-cell *matHeaderCellDef>Requester</th>
            <td mat-cell *matCellDef="let r">
              <div class="name">{{ r.requesterName || r.requesterEmail }}</div>
              <div class="email">{{ r.requesterEmail }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="type">
            <th mat-header-cell *matHeaderCellDef>Type</th>
            <td mat-cell *matCellDef="let r"><app-type-chip [type]="r.type"></app-type-chip></td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let r"><app-status-chip [status]="r.status"></app-status-chip></td>
          </ng-container>

          <ng-container matColumnDef="created">
            <th mat-header-cell *matHeaderCellDef>Submitted</th>
            <td mat-cell *matCellDef="let r">{{ r.createdAt | date:'medium' }}</td>
          </ng-container>

          <ng-container matColumnDef="sla">
            <th mat-header-cell *matHeaderCellDef>SLA</th>
            <td mat-cell *matCellDef="let r"
                [matTooltip]="'Due: ' + (r.slaDueAt | date:'medium')">
              <app-sla-badge [daysRemaining]="r.daysRemaining"></app-sla-badge>
            </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let r">
              <button mat-icon-button color="primary" (click)="open(r)" aria-label="Open">
                <mat-icon>chevron_right</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="cols"></tr>
          <tr mat-row *matRowDef="let r; columns: cols"
              class="clickable" (click)="open(r)"></tr>
        </table>
      </mat-card>
    }
  `,
  styles: [`
    .header { display:flex; justify-content:space-between; align-items:flex-start; gap:1rem; margin-bottom:1rem; }
    h1 { margin: 0; font-size: 1.5rem; }
    .sub { margin: 0.25rem 0 0 0; color: #555; }
    .counters { display:flex; gap:.5rem; align-items:center; }
    .counter { display:inline-flex; align-items:center; gap:.25rem; padding:.25rem .75rem;
               background:#eef2ff; color:#3f51b5; border-radius:999px; font-weight:500; }
    .filter-card { margin-bottom: 1rem; }
    .filters { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
    .filters mat-form-field { min-width: 160px; }
    .center { display:flex; justify-content:center; padding: 3rem 1rem; }
    .error mat-icon { vertical-align: middle; margin-right: 6px; }
    .empty { text-align: center; }
    .empty mat-icon { font-size:48px; height:48px; width:48px; opacity:.5; }
    .table-card { overflow:auto; }
    table { width: 100%; }
    .clickable { cursor: pointer; }
    .clickable:hover { background: #f5f5ff; }
    .name { font-weight: 500; }
    .email { font-size: .75rem; color: #666; }
  `]
})
export class AdminQueueComponent implements OnInit {
  private api = inject(AdminRequestService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  rows = signal<DsarRequest[]>([]);
  total = signal(0);
  loading = signal(true);
  error = signal<string | null>(null);

  readonly cols = ['requester', 'type', 'status', 'created', 'sla', 'actions'];

  filters = this.fb.nonNullable.group({
    type: [null as DsarType | null],
    status: [null as DsarStatus | null]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filters.getRawValue();
    this.api.search({ type: v.type, status: v.status, page: 0, size: 100 }).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.total.set(p.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not load queue');
        this.loading.set(false);
      }
    });
  }

  clearFilters(): void {
    this.filters.reset({ type: null, status: null });
    this.load();
  }

  open(r: DsarRequest): void {
    this.router.navigate(['/admin/queue', r.id]);
  }
}
