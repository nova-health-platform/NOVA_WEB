import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SitePasswordService } from '../services/site-password.service';

@Injectable({ providedIn: 'root' })
export class SitePasswordGuard implements CanActivate {
  constructor(
    private sitePasswordService: SitePasswordService,
    private router: Router
  ) {}

  canActivate(): boolean {
    // Si l'utilisateur n'est pas authentifié, rediriger vers la page de protection
    if (!this.sitePasswordService.isAuthenticated()) {
      this.router.navigate(['/site-password']);
      return false;
    }
    return true;
  }
}

