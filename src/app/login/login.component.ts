import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>('http://localhost:5000/api/login', {
      username: this.username,
      password: this.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.access_token && res.refresh_token) {
          // ✅ Stock tokens + user
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('refresh_token', res.refresh_token);
          localStorage.setItem('user', JSON.stringify(res.user));

          this.successMessage = 'Login successful!';
          setTimeout(() => this.router.navigate(['/']), 1000);
        } else {
          this.errorMessage = 'Invalid response from server.';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Login failed';
      }
    });
  }
}
