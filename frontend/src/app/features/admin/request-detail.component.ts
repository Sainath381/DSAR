import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe, JsonPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AdminRequestService } from '../../core/admin-request.service';
import { AuditService } from '../../core/audit.service';
import { AuditEntry, DsarRequest, DsarStatus, DsarType } from '../../core/models';
import { SlaBadgeComponent } from '../../shared/sla-badge.component';
import { StatusChipComponent } from '../../shared/status-chip.component';
import { TypeChipComponent } from '../../shared/type-chip.component';
import { AuditRowComponent } from '../../shared/audit-row.component';
import {
  TransitionDialogComponent,
  TransitionDialogData,
  TransitionDialogResult
} from './transition-dialog.component';
import {
  ConfirmDialogComponent, ConfirmDialogData
} from '../../shared/confirm-dialog.component';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [
    CommonModule, DatePipe, JsonPipe, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatDividerModule, MatDialogModule, MatSnackBarModule, MatTooltipModule,
    SlaBadgeComponent, StatusChipComponent, TypeChipComponent, AuditRowComponent
  ],
  template: `
    <div class="header">
      <a mat-stroked-button routerLink="/admin/queue">
        <mat-icon>arrow_back</mat-icon>&nbsp;Back to queue
      </a>
      @if (req(); as r) {
        <div class="title-row">
          <app-type-chip [type]="r.type"></app-type-chip>
          <h1>Request {{ r.id | slice:0:8 }}…</h1>
          <app-status-chip [status]="r.status"></app-status-chip>
          <app-sla-badge [daysRemaining]="r.daysRemaining"></app-sla-badge>
        </div>
      }
    </div>

    @if (loading()) {
      <div class="center"><mat-spinner diameter="32"></mat-spinner></div>
    } @else if (error()) {
      <mat-card class="error">
        <mat-card-content>
          <mat-icon color="warn">error_outline</mat-icon> {{ error() }}
        </mat-card-content>
      </mat-card>
    } @else if (req(); as r) {
      <div class="grid">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Requester</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <dl>
              <dt>Name</dt><dd>{{ r.requesterName || '—' }}</dd>
              <dt>Email</dt><dd>{{ r.requesterEmail }}</dd>
              <dt>Requester ID</dt><dd class="mono">{{ r.requesterId }}</dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>Timing</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <dl>
              <dt>Submitted</dt><dd>{{ r.createdAt | date:'medium' }}</dd>
              <dt>Last updated</dt><dd>{{ r.updatedAt | date:'medium' }}</dd>
              <dt>SLA due</dt><dd>{{ r.slaDueAt | date:'medium' }}</dd>
              <dt>Days remaining</dt><dd>
                <app-sla-badge [daysRemaining]="r.daysRemaining"></app-sla-badge>
              </dd>
            </dl>
          </mat-card-content>
        </mat-card>

        <mat-card class="span-two">
          <mat-card-header>
            <mat-card-title>Request payload</mat-card-title>
            <mat-card-subtitle>What the customer submitted</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <pre class="json">{{ (r.payload || {}) | json }}</pre>
          </mat-card-content>
        </mat-card>

        @if (r.result) {
          <mat-card class="span-two">
            <mat-card-header>
              <mat-card-title>Execution result</mat-card-title>
              <mat-card-subtitle>Produced at completion</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <pre class="json">{{ r.result | json }}</pre>
            </mat-card-content>
          </mat-card>
        }

        <mat-card class="span-two">
          <mat-card-header>
            <mat-card-title>
              Audit trail
              <a mat-icon-button class="external" [routerLink]="['/admin/audit']"
                 [queryParams]="{ entityType: 'DsarRequest', entityId: r.id }"
                 matTooltip="Open full audit log filtered to this request">
                <mat-icon>open_in_new</mat-icon>
              </a>
            </mat-card-title>
            <mat-card-subtitle>Every change to this request</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (auditLoading()) {
              <div class="center"><mat-spinner diameter="24"></mat-spinner></div>
            } @else if (audit().length === 0) {
              <p class="muted">No audit entries yet.</p>
            } @else {
              <div class="audit-list">
                @for (a of audit(); track a.id) {
                  <app-audit-row [entry]="a"></app-audit-row>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>

        <mat-card class="span-two actions-card">
          <mat-card-header>
            <mat-card-title>Actions</mat-card-title>
            <mat-card-subtitle>
              @if (r.status === 'APPROVED') {
                Ready to execute the {{ r.type }} action
              } @else {
                Valid transitions from {{ r.status }}
              }
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            @if (r.status === 'APPROVED') {
              <div class="actions">
                <button mat-flat-button color="primary" (click)="complete()"
                        [disabled]="working()">
                  <mat-icon>task_alt</mat-icon>&nbsp;
                  @if (working()) { Executing… } @else { Complete & execute {{ r.type }} }
                </button>
              </div>
              <p class="muted">
                This will
                @if (r.type === 'ACCESS') { generate a downloadable JSON export of the customer's data. }
                @if (r.type === 'DELETE') { anonymize the customer's record (email &amp; name redacted, account disabled). Audit history is preserved. }
                @if (r.type === 'CORRECT') { apply the requested change to the customer record, with before/after captured in audit. }
              </p>
            } @else if (availableTargets().length === 0) {
              <p class="muted">
                @if (r.status === 'REJECTED') {
                  This request was rejected. No further actions available.
                } @else if (r.status === 'COMPLETED') {
                  This request has been completed. No further actions available.
                }
              </p>
            } @else {
              <div class="actions">
                @for (t of availableTargets(); track t) {
                  <button mat-flat-button
                          [color]="t === 'REJECTED' ? 'warn' : 'primary'"
                          (click)="open(t)">
                    <mat-icon>{{ iconFor(t) }}</mat-icon>&nbsp;{{ labelFor(t) }}
                  </button>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .header { margin-bottom: 1rem; display:flex; flex-direction:column; gap:.75rem; }
    .title-row { display:flex; gap:.75rem; align-items:center; flex-wrap:wrap; }
    h1 { margin: 0; font-size: 1.25rem; font-family: monospace; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .span-two { grid-column: span 2; }
    dl { display:grid; grid-template-columns: auto 1fr; gap:.35rem 1rem; margin:0; }
    dt { color:#666; font-size:.85rem; align-self:center; }
    dd { margin:0; }
    .mono { font-family: monospace; font-size: .85rem; }
    .json { background:#fafafa; border:1px solid #e0e0e0; padding:.75rem; border-radius:6px;
            max-height: 400px; overflow:auto; font-size:.8rem; }
    .actions { display:flex; gap:.75rem; flex-wrap:wrap; margin-bottom:.5rem; }
    .actions-card { background: #fafbff; }
    .muted { color:#666; font-style: italic; margin: 0; }
    .center { display:flex; justify-content:center; padding: 3rem 1rem; }
    .error mat-icon { vertical-align: middle; margin-right: 6px; }
    .audit-list { display:flex; flex-direction:column; }
    mat-card-title a.external { vertical-align: middle; margin-left: .25rem; }
    mat-card-title a.external mat-icon { font-size: 18px; height: 18px; width: 18px; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .span-two { grid-column: span 1; } }
  `]
})
export class RequestDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(AdminRequestService);
  private auditApi = inject(AuditService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);

  private static readonly TRANSITIONS: Record<DsarStatus, DsarStatus[]> = {
    SUBMITTED:  ['IN_REVIEW', 'REJECTED'],
    IN_REVIEW:  ['APPROVED', 'REJECTED'],
    APPROVED:   [],
    REJECTED:   [],
    COMPLETED:  []
  };

  req = signal<DsarRequest | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  working = signal(false);
  audit = signal<AuditEntry[]>([]);
  auditLoading = signal(true);

  availableTargets = computed<DsarStatus[]>(() => {
    const r = this.req();
    if (!r) return [];
    return RequestDetailComponent.TRANSITIONS[r.status] ?? [];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigateByUrl('/admin/queue');
      return;
    }
    this.load(id);
  }

  load(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get(id).subscribe({
      next: (r) => { this.req.set(r); this.loading.set(false); },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Could not load request');
        this.loading.set(false);
      }
    });
    this.loadAudit(id);
  }

  loadAudit(id: string): void {
    this.auditLoading.set(true);
    this.auditApi.search({
      entityType: 'DsarRequest',
      entityId: id,
      size: 50
    }).subscribe({
      next: (p) => { this.audit.set(p.content); this.auditLoading.set(false); },
      error: () => { this.audit.set([]); this.auditLoading.set(false); }
    });
  }

  open(target: DsarStatus): void {
    const r = this.req();
    if (!r) return;
    const data: TransitionDialogData = {
      targetStatus: target,
      currentStatus: r.status,
      requesterLabel: r.requesterEmail || r.requesterId,
      requireNote: target === 'REJECTED'
    };
    this.dialog.open<TransitionDialogComponent, TransitionDialogData, TransitionDialogResult>(
      TransitionDialogComponent, { data, width: '480px' }
    ).afterClosed().subscribe((res) => {
      if (!res?.confirmed) return;
      this.api.transition(r.id, { targetStatus: target, note: res.note }).subscribe({
        next: (updated) => {
          this.req.set(updated);
          this.loadAudit(updated.id);
          this.snack.open(`Status changed to ${target}`, 'OK', { duration: 2500 });
        },
        error: (err) => {
          this.snack.open(err?.error?.message ?? 'Transition failed', 'Dismiss', { duration: 4000 });
        }
      });
    });
  }

  complete(): void {
    const r = this.req();
    if (!r) return;
    const dialogData = this.completeDialogData(r.type);
    this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent, { data: dialogData, width: '480px' }
    ).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.working.set(true);
      this.api.complete(r.id).subscribe({
        next: (updated) => {
          this.req.set(updated);
          this.loadAudit(updated.id);
          this.working.set(false);
          this.snack.open(`${r.type} executed. Request completed.`, 'OK', { duration: 3000 });
        },
        error: (err) => {
          this.working.set(false);
          this.snack.open(err?.error?.message ?? 'Execution failed', 'Dismiss', { duration: 4000 });
        }
      });
    });
  }

  private completeDialogData(t: DsarType): ConfirmDialogData {
    switch (t) {
      case 'DELETE':
        return {
          title: 'Anonymize customer record?',
          message: 'The customer\'s email and name will be redacted, and the account disabled.',
          warning: 'This is irreversible. Audit history is preserved.',
          confirmLabel: 'Anonymize',
          confirmColor: 'warn',
          icon: 'delete_forever'
        };
      case 'CORRECT':
        return {
          title: 'Apply correction?',
          message: 'The customer record will be updated with the requested change. Before/after values are captured in audit.',
          confirmLabel: 'Apply correction',
          confirmColor: 'primary',
          icon: 'edit'
        };
      default:
        return {
          title: 'Generate access export?',
          message: 'A JSON snapshot of the customer\'s profile, request history, and related audit entries will be attached to this request.',
          confirmLabel: 'Generate export',
          confirmColor: 'primary',
          icon: 'cloud_download'
        };
    }
  }

  iconFor(t: DsarStatus): string {
    return t === 'APPROVED' ? 'check_circle'
         : t === 'REJECTED' ? 'cancel'
         : t === 'IN_REVIEW' ? 'rate_review'
         : 'swap_horiz';
  }

  labelFor(t: DsarStatus): string {
    return t === 'IN_REVIEW' ? 'Start review'
         : t === 'APPROVED' ? 'Approve'
         : t === 'REJECTED' ? 'Reject'
         : t;
  }
}
