import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuditEntry } from './models';

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AuditFilters {
  action?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actorId?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/admin/audit`;

  search(f: AuditFilters = {}): Observable<PagedResponse<AuditEntry>> {
    let p = new HttpParams();
    if (f.action)     p = p.set('action', f.action);
    if (f.entityType) p = p.set('entityType', f.entityType);
    if (f.entityId)   p = p.set('entityId', f.entityId);
    if (f.actorId)    p = p.set('actorId', f.actorId);
    if (f.from)       p = p.set('from', f.from);
    if (f.to)         p = p.set('to', f.to);
    p = p.set('page', (f.page ?? 0).toString());
    p = p.set('size', (f.size ?? 100).toString());
    return this.http.get<PagedResponse<AuditEntry>>(this.base, { params: p });
  }
}
