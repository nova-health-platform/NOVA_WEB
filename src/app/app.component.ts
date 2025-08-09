import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Import des composants standalone
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

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

  ngOnInit(): void {
    AOS.init({
      duration: 1000,
      once: true
    });
  }
}
