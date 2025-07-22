import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  username = '';
  password = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Login successful!';
        setTimeout(() => this.router.navigate(['/home']), 500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Login failed';
      }
    });
  }
}
