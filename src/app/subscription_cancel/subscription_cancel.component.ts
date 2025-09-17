import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cancel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription_cancel.component.html',
})
export class CancelComponent {
  constructor(private router: Router) {}

  goToAccount() {
    this.router.navigate(['/account']); // Redirection vers le compte
  }

  retryUpgrade() {
    this.router.navigate(['/subscription']); // Redirection vers la page d'abonnement
  }
}
