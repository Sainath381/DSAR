import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuditEntry } from '../core/models';

@Component({
  selector: 'app-audit-row',
  standalone: true,
  imports: [CommonModule, DatePipe, MatIconModule, MatExpansionModule, MatTooltipModule],
  template: `
    <mat-expansion-panel class="row" [class]="toneClass()">
      <mat-expansion-panel-header>
        <mat-panel-title>
          <mat-icon class="ico">{{ icon() }}</mat-icon>
          <span class="action">{{ entry.action }}</span>
          @if (entry.entityType) {
            <span class="entity">{{ entry.entityType }}
              @if (entry.entityId) { : {{ entry.entityId | slice:0:8 }}… }
            </span>
          }
        </mat-panel-title>
        <mat-panel-description>
          <span class="actor">
            <mat-icon>person</mat-icon>
            {{ entry.actorRole || 'SYSTEM' }}
            @if (entry.actorId) { — {{ entry.actorId | slice:0:8 }}… }
          </span>
          <span class="ts">{{ entry.timestamp | date:'medium' }}</span>
        </mat-panel-description>
      </mat-expansion-panel-header>

      <div class="body">
        <div class="meta">
          <div><strong>Timestamp:</strong> {{ entry.timestamp | date:'longDate' }} {{ entry.timestamp | date:'mediumTime' }}</div>
          @if (entry.ipAddress) { <div><strong>IP:</strong> {{ entry.ipAddress }}</div> }
          @if (entry.entityId) { <div><strong>Entity ID:</strong> <code>{{ entry.entityId }}</code></div> }
          @if (entry.actorId) { <div><strong>Actor ID:</strong> <code>{{ entry.actorId }}</code></div> }
        </div>

        <div class="diff">
          <div class="pane">
            <div class="pane-label">Before</div>
            <pre>{{ before() || '—' }}</pre>
          </div>
          <div class="pane">
            <div class="pane-label">After</div>
            <pre>{{ after() || '—' }}</pre>
          </div>
        </div>
      </div>
    </mat-expansion-panel>
  `,
  styles: [`
    .row { margin-bottom: .5rem; }
    .ico { margin-right: .5rem; }
    .action { font-weight: 600; }
    .entity { font-family: monospace; margin-left: .75rem; color: #555; font-size: .85rem; }
    .actor { display:inline-flex; align-items:center; gap:.25rem; font-size:.85rem; color:#555; }
    .actor mat-icon { font-size: 16px; height: 16px; width: 16px; }
    .ts { font-size: .8rem; color:#777; margin-left:auto; }
    .body { font-size: .85rem; }
    .meta { display:flex; gap:1.5rem; flex-wrap:wrap; margin-bottom:.75rem; color:#444; }
    .meta code { background:#f5f5f5; padding: 1px 4px; border-radius:3px; }
    .diff { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
    .pane { border:1px solid #e0e0e0; border-radius:6px; overflow:hidden; background:#fafafa; }
    .pane-label { background:#f0f0f0; padding:.25rem .5rem; font-weight:500; font-size:.75rem; color:#666; }
    .pane pre { margin:0; padding:.5rem; font-size:.75rem; white-space:pre-wrap; word-break:break-word; max-height:200px; overflow:auto; }
    .tone-login   { border-left: 4px solid #1976d2; }
    .tone-create  { border-left: 4px solid #2e7d32; }
    .tone-status  { border-left: 4px solid #6a1b9a; }
    .tone-execute { border-left: 4px solid #00838f; }
    .tone-access  { border-left: 4px solid #f57c00; }
    .tone-failure { border-left: 4px solid #b71c1c; }
    @media (max-width: 768px) { .diff { grid-template-columns: 1fr; } }
  `]
})
export class AuditRowComponent {
  private _entry = signal<AuditEntry | null>(null);

  @Input({ required: true }) set entry(v: AuditEntry) {
    this._entry.set(v);
  }
  get entry(): AuditEntry {
    return this._entry()!;
  }

  before = computed(() => this.pretty(this._entry()?.beforeJson));
  after = computed(() => this.pretty(this._entry()?.afterJson));

  icon = computed(() => {
    const a = this._entry()?.action;
    if (!a) return 'info';
    if (a.startsWith('LOGIN_SUCCESS')) return 'login';
    if (a.startsWith('LOGIN_FAILURE')) return 'error';
    if (a === 'USER_SEEDED') return 'person_add';
    if (a === 'REQUEST_CREATED') return 'post_add';
    if (a === 'STATUS_CHANGED') return 'swap_horiz';
    if (a === 'ACTION_EXECUTED') return 'bolt';
    if (a === 'RECORD_ACCESSED') return 'visibility';
    return 'info';
  });

  toneClass = computed(() => {
    const a = this._entry()?.action;
    if (!a) return '';
    if (a === 'LOGIN_SUCCESS') return 'tone-login';
    if (a === 'LOGIN_FAILURE') return 'tone-failure';
    if (a === 'REQUEST_CREATED') return 'tone-create';
    if (a === 'STATUS_CHANGED') return 'tone-status';
    if (a === 'ACTION_EXECUTED') return 'tone-execute';
    if (a === 'RECORD_ACCESSED') return 'tone-access';
    return '';
  });

  private pretty(json: string | null | undefined): string | null {
    if (!json) return null;
    try {
      return JSON.stringify(JSON.parse(json), null, 2);
    } catch {
      return json;
    }
  }
}
