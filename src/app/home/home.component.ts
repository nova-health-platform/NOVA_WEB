import { Component, AfterViewInit } from '@angular/core';
import { Application } from '@splinetool/runtime';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {

  ngAfterViewInit(): void {
    const canvas = document.getElementById('splineCanvas') as HTMLCanvasElement;

    if (canvas) {
      const splineApp = new Application(canvas);
      splineApp.load('/assets/spline/scene.splinecode');
    }
  }

  scrollTo(sectionId: string) {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  }
}
