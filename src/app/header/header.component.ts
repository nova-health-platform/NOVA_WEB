import { Component, OnInit, OnDestroy, HostListener  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit, OnDestroy {
  isLoggedIn$!: Observable<boolean>;
  menuOpen = false;
  isScrolled = false;

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

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  ngOnDestroy(): void {
    // Nettoyage si nécessaire
  }

}
