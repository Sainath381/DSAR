import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthUser, Role } from './models';

const TOKEN_KEY = 'dsar.auth.token';
const USER_KEY = 'dsar.auth.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private readonly _user = signal<AuthUser | null>(this.loadUser());
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._user() !== null);
  readonly role = computed<Role | null>(() => this._user()?.role ?? null);

  login(email: string, password: string): Observable<AuthUser> {
    const token = btoa(`${email}:${password}`);
    const headers = new HttpHeaders({ Authorization: `Basic ${token}` });
    return this.http
      .get<AuthUser>(`${environment.apiBaseUrl}/api/auth/whoami`, { headers })
      .pipe(
        tap((user) => this.persist(token, user)),
        catchError((err: HttpErrorResponse) => {
          this.clear();
          return throwError(() => err);
        })
      );
  }

  logout(): void {
    this.clear();
    this.router.navigateByUrl('/login');
  }

  getBasicAuthToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private persist(token: string, user: AuthUser): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);
  }

  private loadUser(): AuthUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  }

  private clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
  }
}
