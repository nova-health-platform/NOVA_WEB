import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    let clonedReq = req;

    if (token) {
      clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && localStorage.getItem('refresh_token')) {
          return this.authService.refreshToken().pipe(
            switchMap((refreshResult) => {
              if (refreshResult && refreshResult.access_token) {
                const newToken = this.authService.getToken();
                const retryReq = req.clone({
                  headers: req.headers.set('Authorization', `Bearer ${newToken}`)
                });
                return next.handle(retryReq);
              } else {
                this.authService.logout();
                return throwError(() => error);
              }
            }),
            catchError(err => {
              this.authService.logout();
              return throwError(() => err);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}
