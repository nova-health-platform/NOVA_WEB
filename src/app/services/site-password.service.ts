import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SitePasswordService {
  private readonly PASSWORD_KEY = 'site_password_authenticated';
  // Définissez votre mot de passe ici - pour la production, stockez-le dans un fichier d'environnement
  private readonly SITE_PASSWORD = 'NOVA2025'; // Changez ce mot de passe selon vos besoins

  /**
   * Vérifie si sessionStorage est disponible
   */
  private isStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
        return false;
      }
      const test = '__storage_test__';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Vérifie si l'utilisateur a saisi le mot de passe correct
   */
  isAuthenticated(): boolean {
    if (!this.isStorageAvailable()) {
      return false;
    }
    try {
      return sessionStorage.getItem(this.PASSWORD_KEY) === 'true';
    } catch (e) {
      console.error('Error accessing sessionStorage:', e);
      return false;
    }
  }

  /**
   * Vérifie le mot de passe et stocke l'authentification en session
   */
  authenticate(password: string): boolean {
    if (password === this.SITE_PASSWORD) {
      if (this.isStorageAvailable()) {
        try {
          sessionStorage.setItem(this.PASSWORD_KEY, 'true');
          return true;
        } catch (e) {
          console.error('Error saving to sessionStorage:', e);
          return false;
        }
      }
      return true; // Si pas de storage, on accepte quand même le mot de passe
    }
    return false;
  }

  /**
   * Déconnecte l'utilisateur (supprime l'authentification)
   */
  logout(): void {
    if (this.isStorageAvailable()) {
      try {
        sessionStorage.removeItem(this.PASSWORD_KEY);
      } catch (e) {
        console.error('Error removing from sessionStorage:', e);
      }
    }
  }

  /**
   * Récupère le mot de passe (pour affichage dans la console ou debug)
   * À ne pas utiliser en production
   */
  getPassword(): string {
    return this.SITE_PASSWORD;
  }
}

