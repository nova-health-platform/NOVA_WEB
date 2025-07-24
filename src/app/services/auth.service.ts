import { Injectable, EventEmitter } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api';
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());
  menuCloseEvent = new EventEmitter<void>();

  constructor(private http: HttpClient, private router: Router) {}

  /** ✅ Vérifie s'il existe un token en local */
  private hasToken(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /** ✅ Observable utilisé dans le header */
  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  /** ✅ Enregistre un utilisateur avec les nouveaux champs */
  register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    region?: string;
    consent_rgpd?: boolean;
    consent_hipaa?: boolean;
  }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data).pipe(
      tap((res: any) => this.storeTokens(res))
    );
  }

  /** ✅ Connecte un utilisateur */
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((res: any) => this.storeTokens(res))
    );
  }

  /** ✅ Stocke les tokens et met à jour l'état */
  private storeTokens(res: any): void {
    if (res.access_token && res.refresh_token) {
      localStorage.setItem('access_token', res.access_token);
      localStorage.setItem('refresh_token', res.refresh_token);
      this.loggedIn.next(true);
      this.menuCloseEvent.emit();
    }
  }

  /** ✅ Déconnecte l'utilisateur */
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.loggedIn.next(false);
    this.menuCloseEvent.emit();
    this.router.navigate(['/login']);
  }

  /** ✅ Retourne le token actuel */
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  /** ✅ Rafraîchit le token avec le refresh_token */
  refreshToken(): Observable<any> {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) return of(null);

    return this.http.post(`${this.apiUrl}/refresh`, {}, {
      headers: new HttpHeaders({ Authorization: `Bearer ${refresh_token}` })
    }).pipe(
      tap((res: any) => {
        if (res.access_token) {
          localStorage.setItem('access_token', res.access_token);
        }
      }),
      catchError(() => {
        this.logout();
        return of(null);
      })
    );
  }

  /** ✅ Récupère les infos utilisateur */
  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`);
  }

  /** ✅ Vérifie la session */
  checkSession() {
    return this.http.get('http://localhost:5000/api/me', {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(
      map(() => true),
      catchError(() => {
        this.logout();
        return of(false);
      })
    );
  }
}
