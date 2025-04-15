import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { ScanBodyComponent } from './scan-body/scan-body.component';
import { ScanMedComponent } from './scan-med/scan-med.component';

// Définition des routes
export const routes: Routes = [
    // Route par défaut, redirige vers la page d'accueil
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    { path: 'home', component: HomeComponent },

    { path: 'analysis', component: AnalysisComponent },

    { path: 'skinCheck', component: ScanBodyComponent },

    { path: 'medecineSearch', component: ScanMedComponent },

    // Route pour capturer toutes les autres URLs et rediriger vers 'home'
    { path: '**', redirectTo: 'home' },
];
