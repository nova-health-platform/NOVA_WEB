import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Vérifie le chemin

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  register() {
    if (!this.username || !this.email || !this.password) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register(this.username, this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Registration successful! Redirecting...';
        setTimeout(() => this.router.navigate(['/home']), 1000); // ✅ Redirige vers la home après inscription
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Registration failed';
      }
    });
  }
}
