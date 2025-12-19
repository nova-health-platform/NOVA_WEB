import { Component } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs/operators';

// Import des composants standalone
import { HeaderComponent } from './header/header.component';

import AOS from 'aos';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    FormsModule,
    HeaderComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'WEB_NOVA';
  showHeader = true;

  constructor(private router: Router) {
    // Écouter les changements de route pour masquer le header sur la page de protection
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showHeader = event.url !== '/site-password';
    });
  }

  ngOnInit(): void {
    // Vérifier la route initiale
    this.showHeader = this.router.url !== '/site-password';
    
    AOS.init({
      duration: 1000,
      once: true
    });
  }
}
