import { Component, AfterViewInit } from '@angular/core';
import { Application } from '@splinetool/runtime';
import { AuthService } from '../services/auth.service';
import { RouterModule } from '@angular/router';
import AOS from 'aos';
import lottie from 'lottie-web';


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
    window.scrollTo({ top: 0, behavior: 'auto' });

    this.authService.isLoggedIn().subscribe((loggedIn) => {
      this.isAuthenticated = loggedIn;
    });

    this.initAOS();
    this.setupSpline_aura().catch((e) => {
      console.error(e);
      this.hideLoader(); // sécurité supplémentaire
    });
    this.setupAOSRefreshOnSnap();

    const lottieContainer = document.getElementById('lottie-container');
    if (lottieContainer) {
      lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'assets/aura.json'
      });
    } else {
      console.warn('Lottie container not found');
    }
  }

  private initAOS(): void {
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
    });
  }

  // ==== NOUVELLE VERSION ROBUSTE ====
  private async setupSpline_aura(): Promise<void> {
    const aura = document.getElementById('splineCanvas_aura') as HTMLCanvasElement | null;

    // Si le canvas n'existe pas, on n'attend pas
    if (!aura) {
      console.warn('#splineCanvas_aura introuvable');
      this.hideLoader();
      return;
    }

    aura.style.opacity = '0';
    const splineApp = new Application(aura);

    const LOAD_TIMEOUT_MS = 8000; // adapte si besoin

    try {
      // Timeout: si Spline ne résout jamais, on passe au fallback
      await Promise.race([
        splineApp.load('/assets/spline/aura.splinecode'),
        this.timeout(LOAD_TIMEOUT_MS, 'Timeout Spline'),
      ]);

      // Spline chargé -> fade-in + hide loader
      this.fadeInAura(aura);
    } catch (e) {
      console.warn('Échec Spline, fallback PNG…', e);
      try {
        await this.drawPngOnCanvas(aura, '/assets/spline/aura.png');
        this.fadeInAura(aura);
      } catch (pngErr) {
        console.error('Échec fallback PNG :', pngErr);
        // On termine quand même le chargement pour éviter le spinner infini
        this.hideLoader();
        // Optionnel : masquer le canvas si rien n’a pu être rendu
        aura.style.display = 'none';
      }
    }
  }

  private fadeInAura(aura: HTMLCanvasElement): void {
    setTimeout(() => {
      aura.style.transition = 'opacity 0.5s ease';
      aura.style.opacity = '1';
      this.hideLoader();
    }, 50);
  }

  private hideLoader(): void {
    const loader = document.getElementById('page-loader');
    if (loader) loader.classList.add('hidden'); // Assure-toi que .hidden { display:none; } existe
  }

  // ---- Helpers ----
  private timeout(ms: number, message = 'timeout'): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
  }

  private drawPngOnCanvas(canvas: HTMLCanvasElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Si l’image venait d’un autre domaine, penser à img.crossOrigin = 'anonymous';
      img.onload = () => {
        // Ajuste le canvas si besoin
        if (!canvas.width || !canvas.height) {
          canvas.width = img.width;
          canvas.height = img.height;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Contexte 2D indisponible'));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      img.onerror = () => reject(new Error(`Impossible de charger ${src}`));
      img.src = src;
    });
  }

  private setupAOSRefreshOnSnap(): void {
    const sections = document.querySelectorAll('section');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const animatedElements = entry.target.querySelectorAll<HTMLElement>('[data-aos]');
          if (entry.isIntersecting) {
            animatedElements.forEach((el) => el.classList.add('aos-animate'));
          } else {
            animatedElements.forEach((el) => el.classList.remove('aos-animate'));
          }
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach((section) => observer.observe(section));
  }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
