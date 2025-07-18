import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="min-h-screen flex justify-center items-center bg-[#101010] text-white">
      <div class="bg-white/10 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 class="text-3xl font-bold mb-6 text-center">My Account</h1>
        <div *ngIf="user">
          <p><strong>Username:</strong> {{ user.username }}</p>
          <p><strong>Email:</strong> {{ user.email }}</p>
          <p><strong>Joined:</strong> {{ user.created_at | date }}</p>
        </div>
      </div>
    </section>
  `
})
export class AccountComponent implements OnInit {
  user: any;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('http://localhost:5000/api/me').subscribe({
      next: (data) => this.user = data,
      error: (err) => console.error('Error loading account:', err)
    });
  }
}
