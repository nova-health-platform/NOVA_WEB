import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription_success.component.html',
})
export class SuccessComponent {
  constructor(private router: Router) {}

  goToDashboard() {
    this.router.navigate(['/analysis']); // Redirection vers l'analyse
  }
}
