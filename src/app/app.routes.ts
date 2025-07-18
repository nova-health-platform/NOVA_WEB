import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AnalysisComponent } from './analysis/analysis.component';
import { ScanBodyComponent } from './scan-body/scan-body.component';
import { PsyTestComponent } from './psy-test/psy-test.component';
import { ScanMedComponent } from './scan-med/scan-med.component';
import { SmartpredComponent } from './psy-test/smartpred/smartpred.component';
import { Phq9Component } from './psy-test/phq9/phq9.component';
import { Gad7Component } from './psy-test/gad7/gad7.component';
import { Dass21Component } from './psy-test/dass21/dass21.component';
import { IsiComponent } from './psy-test/isi/isi.component';
import { BurnoutComponent } from './psy-test/burnout/burnout.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { SuccessComponent } from './subscription_success/subscription_success.component';
import { CancelComponent } from './subscription_cancel/subscription_cancel.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AccountComponent } from './account/account.component';
import { AuthGuard } from './guards/auth.guards';

// Définition des routes
export const routes: Routes = [
    // Route par défaut, redirige vers la page d'accueil
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    { path: 'home', component: HomeComponent },

    { path: 'login', component: LoginComponent },

    { path: 'register', component: RegisterComponent },

    { path: 'account', component: AccountComponent, canActivate: [AuthGuard] },

    { path: 'subscription', component: SubscriptionComponent },

    { path: 'success', component: SuccessComponent },

    { path: 'cancel', component: CancelComponent },

    { path: 'analysis', component: AnalysisComponent },

    { path: 'skinCheck', component: ScanBodyComponent },

    { path: 'mentalHealth', component: PsyTestComponent },

    { path: 'smartpred', component: SmartpredComponent },

    { path: 'phq9', component: Phq9Component },

    { path: 'gad7', component: Gad7Component },

    { path: 'dass21', component: Dass21Component },

    { path: 'isi', component: IsiComponent },

    { path: 'burnout', component: BurnoutComponent },

    { path: 'medecineSearch', component: ScanMedComponent },

    // Route pour capturer toutes les autres URLs et rediriger vers 'home'
    { path: '**', redirectTo: 'home' },
];
