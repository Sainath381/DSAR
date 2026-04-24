import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DsarRequest, DsarType } from './models';

export interface CreateRequestPayload {
  type: DsarType;
  note?: string;
  payload?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  private http = inject(HttpClient);
  private base = `${environment.apiBaseUrl}/api/customer/requests`;

  listMine(): Observable<DsarRequest[]> {
    return this.http.get<DsarRequest[]>(this.base);
  }

  getMine(id: string): Observable<DsarRequest> {
    return this.http.get<DsarRequest>(`${this.base}/${id}`);
  }

  create(body: CreateRequestPayload): Observable<DsarRequest> {
    return this.http.post<DsarRequest>(this.base, body);
  }

  downloadExport(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/${id}/export`, { responseType: 'blob' });
  }
}
