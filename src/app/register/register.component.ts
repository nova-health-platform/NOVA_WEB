import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  first_name = '';
  last_name = '';
  email = '';
  password = '';
  phone = '';
  country = '';
  consent_rgpd = false;
  consent_hipaa = false;

  countries: any[] = [];
  filteredCountries: any[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.http.get<any[]>('assets/countries.json').subscribe((data) => {
      this.countries = data;
      this.filteredCountries = data;
    });
  }

  filterCountries(event: any) {
    const query = event.target.value.toLowerCase();
    this.filteredCountries = this.countries.filter(c => c.name.toLowerCase().includes(query));
  }

  register() {
    if (!this.first_name || !this.last_name || !this.email || !this.password || !this.country) {
      this.errorMessage = 'All fields are required.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register({
      first_name: this.first_name,
      last_name: this.last_name,
      email: this.email,
      password: this.password,
      phone: this.phone,
      country: this.country,
      consent_rgpd: this.consent_rgpd,
      consent_hipaa: this.consent_hipaa
    }).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Registration successful! Redirecting...';
        setTimeout(() => this.router.navigate(['/home']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error || 'Registration failed';
      }
    });
  }
}
