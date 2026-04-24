import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DsarRequest, DsarStatus, DsarType } from './models';

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface SearchParams {
  type?: DsarType | null;
  status?: DsarStatus | null;
  page?: number;
  size?: number;
}

export interface TransitionPayload {
  targetStatus: DsarStatus;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminRequestService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/admin/requests`;

  search(params: SearchParams = {}): Observable<PagedResponse<DsarRequest>> {
    let p = new HttpParams();
    if (params.type)   p = p.set('type', params.type);
    if (params.status) p = p.set('status', params.status);
    p = p.set('page', (params.page ?? 0).toString());
    p = p.set('size', (params.size ?? 25).toString());
    return this.http.get<PagedResponse<DsarRequest>>(this.base, { params: p });
  }

  get(id: string): Observable<DsarRequest> {
    return this.http.get<DsarRequest>(`${this.base}/${id}`);
  }

  transition(id: string, body: TransitionPayload): Observable<DsarRequest> {
    return this.http.post<DsarRequest>(`${this.base}/${id}/transition`, body);
  }

  complete(id: string): Observable<DsarRequest> {
    return this.http.post<DsarRequest>(`${this.base}/${id}/complete`, {});
  }
}
