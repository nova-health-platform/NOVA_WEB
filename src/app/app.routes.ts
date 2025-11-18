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
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactComponent } from './contact/contact.component';
import { TermsOfUseComponent } from './terms-of-use/terms-of-use.component';
import { DocsComponent } from './docs/docs.component';

// Définition des routes
export const routes: Routes = [
    // Route par défaut, redirige vers la page d'accueil
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    { path: 'home', component: HomeComponent },

    { path: 'login', component: LoginComponent },

    { path: 'register', component: RegisterComponent },

    { path: 'account', component: AccountComponent, canActivate: [AuthGuard] },

    { path: 'subscription', component: SubscriptionComponent, canActivate: [AuthGuard] },

    { path: 'success', component: SuccessComponent, canActivate: [AuthGuard] },

    { path: 'cancel', component: CancelComponent, canActivate: [AuthGuard] },

    { path: 'analysis', component: AnalysisComponent },

    { path: 'skinCheck', component: ScanBodyComponent },

    { path: 'mentalHealth', component: PsyTestComponent },

    { path: 'smartpred', component: SmartpredComponent, canActivate: [AuthGuard] },

    { path: 'phq9', component: Phq9Component, canActivate: [AuthGuard] },

    { path: 'gad7', component: Gad7Component, canActivate: [AuthGuard] },

    { path: 'dass21', component: Dass21Component, canActivate: [AuthGuard] },

    { path: 'isi', component: IsiComponent, canActivate: [AuthGuard] },

    { path: 'burnout', component: BurnoutComponent, canActivate: [AuthGuard] },

    { path: 'medecineSearch', component: ScanMedComponent },

    { path: 'about-us', component: AboutUsComponent },

    { path: 'contact', component: ContactComponent },

    { path: 'roadmap', component: AboutUsComponent },

    { path: 'terms-of-use', component: TermsOfUseComponent },

    { path: 'docs', component: DocsComponent },

    // Route pour capturer toutes les autres URLs et rediriger vers 'home'
    { path: '**', redirectTo: 'home' },
];
