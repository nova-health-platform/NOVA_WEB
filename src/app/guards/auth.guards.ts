import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate() {
    const token = this.authService.getToken();
    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
