import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, switchMap, map, catchError } from 'rxjs';
import { AuthService } from './auth.service';

export interface MentalHealthTestPayload {
  profile_id?: number | null;
  test_name: string;
  score: number;
  interpretation: string;
  answers?: any;
}

@Injectable({ providedIn: 'root' })
export class TestResultsService {
  private apiUrl = 'http://localhost:5000/api/mental-health-tests';
  private summaryUrl = 'http://localhost:5000/api/mental-health-tests/summary';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): Observable<HttpHeaders | null> {
    return this.authService.checkAndRefreshToken().pipe(
      map(() => {
        const token = this.authService.getToken();
        if (!token) {
          return null;
        }
        return new HttpHeaders({ Authorization: `Bearer ${token}` });
      }),
      catchError(() => of(null))
    );
  }

  getActiveProfileId(): number | null {
    const stored = localStorage.getItem('active_profile_id');
    if (!stored) {
      return null;
    }
    const parsed = Number(stored);
    return Number.isNaN(parsed) ? null : parsed;
  }

  setActiveProfileId(id: number | null): void {
    if (id === null || id === undefined) {
      localStorage.removeItem('active_profile_id');
      return;
    }
    localStorage.setItem('active_profile_id', id.toString());
  }

  saveResult(payload: MentalHealthTestPayload): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        if (!headers) {
          return of(null);
        }
        return this.http.post(this.apiUrl, payload, { headers });
      }),
      catchError((error) => {
        console.error('Failed to save test result', error);
        return of(null);
      })
    );
  }

  getTestSummary(profileId: number): Observable<any> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => {
        if (!headers) {
          return of(null);
        }
        return this.http.get(`${this.summaryUrl}?profile_id=${profileId}`, { headers });
      })
    );
  }
}

