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
import { SitePasswordGuard } from './guards/site-password.guard';
import { SitePasswordComponent } from './site-password/site-password.component';
import { AboutUsComponent } from './about-us/about-us.component';
import { ContactComponent } from './contact/contact.component';
import { TermsOfUseComponent } from './terms-of-use/terms-of-use.component';
import { DocsComponent } from './docs/docs.component';

// Définition des routes
export const routes: Routes = [
    // Route pour la protection par mot de passe (non protégée)
    { path: 'site-password', component: SitePasswordComponent },

    // Route par défaut, redirige vers la page d'accueil (le guard sera appliqué sur /home)
    { path: '', redirectTo: 'home', pathMatch: 'full' },

    { path: 'home', component: HomeComponent, canActivate: [SitePasswordGuard] },

    { path: 'login', component: LoginComponent, canActivate: [SitePasswordGuard] },

    { path: 'register', component: RegisterComponent, canActivate: [SitePasswordGuard] },

    { path: 'account', component: AccountComponent, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'subscription', component: SubscriptionComponent, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'success', component: SuccessComponent, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'cancel', component: CancelComponent, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'analysis', component: AnalysisComponent, canActivate: [SitePasswordGuard] },

    { path: 'skinCheck', component: ScanBodyComponent, canActivate: [SitePasswordGuard] },

    { path: 'mentalHealth', component: PsyTestComponent, canActivate: [SitePasswordGuard] },

    { path: 'smartpred', component: SmartpredComponent, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'phq9', component: Phq9Component, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'gad7', component: Gad7Component, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'dass21', component: Dass21Component, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'isi', component: IsiComponent, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'burnout', component: BurnoutComponent, canActivate: [SitePasswordGuard, AuthGuard] },

    { path: 'medecineSearch', component: ScanMedComponent, canActivate: [SitePasswordGuard] },

    { path: 'about-us', component: AboutUsComponent, canActivate: [SitePasswordGuard] },

    { path: 'contact', component: ContactComponent, canActivate: [SitePasswordGuard] },

    { path: 'roadmap', component: AboutUsComponent, canActivate: [SitePasswordGuard] },

    { path: 'terms-of-use', component: TermsOfUseComponent, canActivate: [SitePasswordGuard] },

    { path: 'docs', component: DocsComponent, canActivate: [SitePasswordGuard] },

    // Route pour capturer toutes les autres URLs et rediriger vers 'home'
    // Note: Le guard sera appliqué sur /home, donc pas besoin de le mettre ici
    { path: '**', redirectTo: 'home' },
];
