import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SitePasswordService } from '../services/site-password.service';

@Component({
  selector: 'app-site-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './site-password.component.html',
  styleUrls: ['./site-password.component.scss']
})
export class SitePasswordComponent implements OnInit {
  password = '';
  errorMessage = '';
  loading = false;

  constructor(
    private sitePasswordService: SitePasswordService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Vérifier si on est déjà authentifié (peut arriver si on recharge la page)
    if (this.sitePasswordService.isAuthenticated()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit(): void {
    if (!this.password) {
      this.errorMessage = 'Please enter a password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Vérifier le mot de passe
    if (this.sitePasswordService.authenticate(this.password)) {
      // Rediriger vers la page demandée ou vers home
      const redirectUrl = this.router.url === '/site-password' ? '/home' : this.router.url;
      this.router.navigate([redirectUrl]);
    } else {
      this.errorMessage = 'Incorrect password. Please try again.';
      this.password = '';
      this.loading = false;
    }
  }
}

