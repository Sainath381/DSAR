import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.getBasicAuthToken();
  const cloned = token
    ? req.clone({ setHeaders: { Authorization: `Basic ${token}` } })
    : req;

  return next(cloned).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !req.url.endsWith('/api/auth/whoami')) {
        auth.logout();
      }
      if (err.status === 403) {
        router.navigateByUrl('/forbidden');
      }
      return throwError(() => err);
    })
  );
};
