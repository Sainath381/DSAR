import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuditService } from '../../core/audit.service';
import { AuditEntry } from '../../core/models';
import { AuditRowComponent } from '../../shared/audit-row.component';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    AuditRowComponent
  ],
  template: `
    <div class="header">
      <div>
        <h1>Audit log</h1>
        <p class="sub">Append-only record of every action. Click a row to inspect before / after.</p>
      </div>
      <div class="counters">
        <span class="counter">
          <mat-icon>history</mat-icon> {{ total() }}
        </span>
      </div>
    </div>

    <mat-card class="filter-card">
      <form [formGroup]="filters" (change)="load()" class="filters">
        <mat-form-field appearance="outline">
          <mat-label>Action</mat-label>
          <mat-select formControlName="action">
            <mat-option [value]="null">All</mat-option>
            <mat-option value="LOGIN_SUCCESS">LOGIN_SUCCESS</mat-option>
            <mat-option value="LOGIN_FAILURE">LOGIN_FAILURE</mat-option>
            <mat-option value="USER_SEEDED">USER_SEEDED</mat-option>
            <mat-option value="REQUEST_CREATED">REQUEST_CREATED</mat-option>
            <mat-option value="STATUS_CHANGED">STATUS_CHANGED</mat-option>
            <mat-option value="ACTION_EXECUTED">ACTION_EXECUTED</mat-option>
            <mat-option value="RECORD_ACCESSED">RECORD_ACCESSED</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Entity type</mat-label>
          <mat-select formControlName="entityType">
            <mat-option [value]="null">All</mat-option>
            <mat-option value="User">User</mat-option>
            <mat-option value="DsarRequest">DsarRequest</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="wide">
          <mat-label>Entity ID</mat-label>
          <input matInput formControlName="entityId" placeholder="UUID or partial" />
        </mat-form-field>

        <button mat-stroked-button type="button" (click)="clear()">
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
          <mat-icon>search_off</mat-icon>
          <p>No audit entries match your filters.</p>
        </mat-card-content>
      </mat-card>
    } @else {
      <div class="rows">
        @for (r of rows(); track r.id) {
          <app-audit-row [entry]="r"></app-audit-row>
        }
      </div>
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
    .filters mat-form-field.wide { min-width: 280px; flex:1; }
    .center { display:flex; justify-content:center; padding: 3rem 1rem; }
    .error mat-icon { vertical-align: middle; margin-right: 6px; }
    .empty { text-align: center; }
    .empty mat-icon { font-size:48px; height:48px; width:48px; opacity:.5; }
    .rows { display:flex; flex-direction: column; }
  `]
})
export class AuditLogComponent implements OnInit {
  private api = inject(AuditService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  rows = signal<AuditEntry[]>([]);
  total = signal(0);
  loading = signal(true);
  error = signal<string | null>(null);

  filters = this.fb.nonNullable.group({
    action: [null as string | null],
    entityType: [null as string | null],
    entityId: ['']
  });

  ngOnInit(): void {
    const entityId = this.route.snapshot.queryParamMap.get('entityId');
    const entityType = this.route.snapshot.queryParamMap.get('entityType');
    if (entityId || entityType) {
      this.filters.patchValue({
        entityId: entityId ?? '',
        entityType: entityType ?? null
      });
    }
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    const v = this.filters.getRawValue();
    this.api.search({
      action: v.action,
      entityType: v.entityType,
      entityId: v.entityId?.trim() || null,
      page: 0,
      size: 200
    }).subscribe({
      next: (p) => {
        this.rows.set(p.content);
        this.total.set(p.totalElements);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not load audit log');
        this.loading.set(false);
      }
    });
  }

  clear(): void {
    this.filters.reset({ action: null, entityType: null, entityId: '' });
    this.router.navigate([], { queryParams: {} });
    this.load();
  }
}
