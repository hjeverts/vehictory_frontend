import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

// Deze endpoints mogen bij een 401 nooit zelf een refresh-poging triggeren
// (dat zou een oneindige lus riskeren of is functioneel zinloos).
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  const cloned = req.clone({
    withCredentials: true,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });

  return next(cloned).pipe(
    catchError((error: unknown) => {
      const skipRefresh = NO_REFRESH_PATHS.some((path) => req.url.includes(path));
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || skipRefresh) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap((res) =>
          next(cloned.clone({ setHeaders: { Authorization: `Bearer ${res.token}` } })),
        ),
        catchError((refreshError) => {
          authService.logout();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
