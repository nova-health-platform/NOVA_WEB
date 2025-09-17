import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

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
  currentUser: any = null;

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
        'Unlimited analyses with profile',
        '5 analyses max without profile',
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

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit(): void {
    // Vérifier d'abord si l'utilisateur a des tokens
    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!accessToken || !refreshToken) {
      this.authService.logout();
      window.location.href = '/login';
      return;
    }
    
    // Charger les données utilisateur
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    const token = this.authService.getToken();
    const headers: { [header: string]: string } = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    this.http.get<any>('http://localhost:5000/api/me', { headers }).subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (err) => {
        if (err.status === 401) {
          // Essayer de rafraîchir le token manuellement
          this.authService.refreshToken().subscribe({
            next: (refreshResult) => {
              // Retry l'appel après le refresh
              this.loadCurrentUser();
            },
            error: (refreshErr) => {
              this.authService.logout();
              window.location.href = '/login';
            }
          });
        }
      }
    });
  }

  subscribe(planId: string) {
    // Vérifier si c'est le plan actuel
    if (this.currentUser && this.currentUser.subscription_plan === planId) {
      return; // Ne rien faire si c'est déjà le plan actuel
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Si c'est le plan gratuit, on peut directement l'assigner
    if (planId === 'free') {
      this.directUpgrade(planId);
      return;
    }

    // Pour les autres plans, utiliser l'upgrade direct au lieu de Stripe
    this.directUpgrade(planId);
  }

  directUpgrade(planId: string) {
    const token = localStorage.getItem('access_token');
    this.performUpgrade(planId, token);
  }

  performUpgrade(planId: string, token: string | null) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    this.http.post<any>('http://localhost:5000/api/upgrade', { planId }, { headers })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = response.message || `Successfully upgraded to ${planId} plan!`;
          
                // Rediriger vers la page appropriée selon le plan
                setTimeout(() => {
                  if (planId === 'free') {
                    // Retour au plan gratuit = cancel
                    window.location.href = '/cancel';
                  } else {
                    // Upgrade vers premium/enterprise = success
                    window.location.href = '/success';
                  }
                }, 1000);
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 401) {
            this.errorMessage = 'Your session has expired. Please log in again.';
            setTimeout(() => {
              window.location.href = '/login';
            }, 3000);
          } else {
            this.errorMessage = err.error?.error || 'An error occurred. Please try again.';
          }
        }
      });
  }
  
}
