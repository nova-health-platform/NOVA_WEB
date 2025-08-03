import { Component, AfterViewInit } from '@angular/core';
import { Application } from '@splinetool/runtime';
import AOS from 'aos';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    this.initAOS();
    this.setupSpline_aura();
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
      splineApp.load('/assets/spline/aura.splinecode');
    }
  }

  private setupSpline_line(): void {
    const line = document.getElementById('splineCanvas_line') as HTMLCanvasElement;
    if (line) {
      const splineApp = new Application(line);
      splineApp.load('/assets/spline/line.splinecode');
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
