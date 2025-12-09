import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-heatmap-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heatmap-overlay.component.html',
  styleUrl: './heatmap-overlay.component.scss'
})
export class HeatmapOverlayComponent implements AfterViewInit, OnChanges {
  @Input() imageUrl: string = '';
  @Input() heatmapData?: string; // Base64 encoded heatmap image or data URL
  @Input() showHeatmap: boolean = false;
  @Input() opacity: number = 0.5; // 0-1
  
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('heatmapCanvas') heatmapCanvas!: ElementRef<HTMLCanvasElement>;
  
  private imageLoaded: boolean = false;
  
  ngAfterViewInit(): void {
    this.renderHeatmap();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] || changes['heatmapData']) {
      this.imageLoaded = false;
      if (this.imageElement?.nativeElement) {
        this.imageElement.nativeElement.onload = () => {
          this.imageLoaded = true;
          this.renderHeatmap();
        };
      }
    }
    if (changes['showHeatmap'] || changes['opacity']) {
      this.renderHeatmap();
    }
  }
  
  /**
   * Render heatmap overlay
   */
  renderHeatmap(): void {
    if (!this.canvasElement?.nativeElement || !this.imageElement?.nativeElement) {
      return;
    }
    
    const canvas = this.canvasElement.nativeElement;
    const ctx = canvas.getContext('2d');
    const img = this.imageElement.nativeElement;
    
    if (!ctx || !img.complete) {
      return;
    }
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    // Draw base image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw heatmap overlay if enabled and data available
    if (this.showHeatmap && this.heatmapData) {
      this.drawHeatmapOverlay(ctx, canvas.width, canvas.height);
    }
  }
  
  /**
   * Draw heatmap overlay
   */
  private drawHeatmapOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // If heatmapData is a base64 image, draw it directly
    if (this.heatmapData) {
      const heatmapImg = new Image();
      heatmapImg.onload = () => {
        ctx.globalAlpha = this.opacity;
        ctx.drawImage(heatmapImg, 0, 0, width, height);
        ctx.globalAlpha = 1.0;
      };
      heatmapImg.src = this.heatmapData;
    } else {
      // Fallback: generate a simple gradient heatmap (if no data provided)
      this.generateFallbackHeatmap(ctx, width, height);
    }
  }
  
  /**
   * Generate fallback heatmap (placeholder when no real data)
   */
  private generateFallbackHeatmap(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    // Create a radial gradient centered on the image
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 0, 0, 0.8)'); // Red center
    gradient.addColorStop(0.5, 'rgba(255, 165, 0, 0.6)'); // Orange
    gradient.addColorStop(1, 'rgba(255, 255, 0, 0.2)'); // Yellow edges
    
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1.0;
  }
  
  /**
   * Toggle heatmap visibility
   */
  toggleHeatmap(): void {
    this.showHeatmap = !this.showHeatmap;
    this.renderHeatmap();
  }
  
  /**
   * Update opacity
   */
  onOpacityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.opacity = parseFloat(input.value) / 100;
    this.renderHeatmap();
  }
}

