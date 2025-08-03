import { Component, AfterViewInit } from '@angular/core';
import { Application } from '@splinetool/runtime';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import AOS from 'aos';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  imports: [RouterModule],
})
export class HomeComponent implements AfterViewInit {

  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  ngAfterViewInit(): void {

    this.authService.isLoggedIn().subscribe((loggedIn) => {
      this.isAuthenticated = loggedIn;
    });

    this.initAOS();
    this.setupSpline_aura();
    this.setupSpline_auras();
    this.setupSpline_line();
    this.setupAOSRefreshOnSnap();

  }

  private initAOS(): void {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
    });
  }

  private setupSpline_aura(): void {
    const aura = document.getElementById('splineCanvas_aura') as HTMLCanvasElement;
    if (aura) {
      const splineApp = new Application(aura);
      splineApp.load('/assets/spline/aura.splinecode').then(() => {
        this.hideLoader();
      });
    }
  }

  private setupSpline_auras(): void {
    const auras = document.getElementById('splineCanvas_auras') as HTMLCanvasElement;
    if (auras) {
      const splineApp = new Application(auras);
      splineApp.load('/assets/spline/auras.splinecode').then(() => {
        this.hideLoader();
      });
    }
  }

  private setupSpline_line(): void {
    const line = document.getElementById('splineCanvas_line') as HTMLCanvasElement;
    if (line) {
      const splineApp = new Application(line);
      splineApp.load('/assets/spline/line.splinecode').then(() => {
        this.hideLoader();
      });
    }
  }

  private hideLoader(): void {
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.classList.add('hidden');
    }
  }


  private setupAOSRefreshOnSnap(): void {
    const sections = document.querySelectorAll('section');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const animatedElements = entry.target.querySelectorAll<HTMLElement>('[data-aos]');

          if (entry.isIntersecting) {
            animatedElements.forEach((el) => {
              el.classList.add('aos-animate');
            });
          } else {
            animatedElements.forEach((el) => {
              el.classList.remove('aos-animate');
            });
          }
        });
      },
      {
        threshold: 0.4,
      }
    );

    sections.forEach((section) => observer.observe(section));
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
