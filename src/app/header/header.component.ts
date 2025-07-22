import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Assure-toi du bon chemin
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  isLoggedIn$!: Observable<boolean>;
  menuOpen = false;

  constructor(private authService: AuthService, private router: RouterModule) {}

  ngOnInit(): void {
    this.isLoggedIn$ = this.authService.isLoggedIn();

    this.authService.menuCloseEvent.subscribe(() => {
      this.menuOpen = false;
    });
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  logout(): void {
    this.authService.logout();
  }
}
