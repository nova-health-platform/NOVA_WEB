import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ApiConfig {
  baseUrl: string;
  endpoints: {
    scanBody: string;
    analysis: string;
    mentalHealth: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private config: ApiConfig = {
    baseUrl: environment.apiUrl,
    endpoints: {
      scanBody: '/api/scan-body',
      analysis: '/api/nova/start',
      mentalHealth: '/api/mental-health/analyze'
    }
  };

  constructor(private http: HttpClient) {}


  /**
   * Get the full API URL for a specific endpoint
   */
  getApiUrl(endpoint: keyof ApiConfig['endpoints']): string {
    return `${this.config.baseUrl}${this.config.endpoints[endpoint]}`;
  }

  /**
   * Scan body analysis
   */
  scanBody(formData: FormData): Observable<any> {
    return this.http.post(this.getApiUrl('scanBody'), formData).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * General analysis (NOVA start)
   */
  startAnalysis(data: any): Observable<any> {
    return this.http.post(this.getApiUrl('analysis'), data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Mental health analysis
   */
  analyzeMentalHealth(data: any): Observable<any> {
    return this.http.post(this.getApiUrl('mentalHealth'), data).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.status === 0) {
      errorMessage = 'Unable to connect to the server. Please check that the API is running.';
    } else if (error.status === 413) {
      errorMessage = 'The image file is too large. Please use a smaller image.';
    } else if (error.status === 415) {
      errorMessage = 'Unsupported image format. Please use JPG, PNG or WEBP.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    } else if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Check API health
   */
  checkHealth(): Observable<any> {
    return this.http.get(`${this.config.baseUrl}/health`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get model information
   */
  getModelInfo(): Observable<any> {
    return this.http.get(`${this.config.baseUrl}/scan-body/info`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get clinical options
   */
  getClinicalOptions(): Observable<any> {
    return this.http.get(`${this.config.baseUrl}/api/clinical-options`).pipe(
      catchError(this.handleError)
    );
  }
}
