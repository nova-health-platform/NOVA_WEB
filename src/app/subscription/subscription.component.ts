import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.scss']
})
export class SubscriptionComponent implements OnInit {
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  plans = [
    {
      name: 'Free',
      price: '0€',
      description: 'Basic plan for occasional users',
      features: [
        '1 profile',
        '1 analysis every 5 hours',
        'No analysis history'
      ],
      planId: 'free'
    },
    {
      name: 'Premium',
      price: '9.99€/month',
      description: 'Perfect for individuals',
      features: [
        'Up to 5 profiles',
        '5 analyses per day per profile',
        '30-day history'
      ],
      planId: 'premium'
    },
    {
      name: 'Enterprise',
      price: '99€/month',
      description: 'Unlimited for professionals',
      features: [
        'Unlimited profiles',
        'Unlimited analyses',
        'Full history'
      ],
      planId: 'enterprise'
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  subscribe(planId: string) {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post<any>('http://localhost:5000/api/checkout/session', { planId })
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.url) {
            window.location.href = response.url; // Redirect to Stripe Checkout
          } else {
            this.errorMessage = 'Unable to start subscription process.';
          }
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err.error?.error || 'An error occurred. Please try again.';
        }
      });
  }
  
}
