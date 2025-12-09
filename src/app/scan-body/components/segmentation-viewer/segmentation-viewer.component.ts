import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-segmentation-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './segmentation-viewer.component.html',
  styleUrl: './segmentation-viewer.component.scss'
})
export class SegmentationViewerComponent implements AfterViewInit, OnChanges {
  @Input() imageUrl: string = '';
  @Input() segmentationMask?: string; // Base64 encoded mask image
  @Input() showSegmentation: boolean = false;
  @Input() measurements?: {
    area?: number; // in mm²
    perimeter?: number; // in mm
    asymmetry?: number; // 0-1, higher = more asymmetric
    diameter?: number; // in mm
  };
  
  @ViewChild('imageElement') imageElement!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  
  private imageLoaded: boolean = false;
  
  ngAfterViewInit(): void {
    this.renderSegmentation();
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl'] || changes['segmentationMask']) {
      this.imageLoaded = false;
      if (this.imageElement?.nativeElement) {
        this.imageElement.nativeElement.onload = () => {
          this.imageLoaded = true;
          this.renderSegmentation();
        };
      }
    }
    if (changes['showSegmentation']) {
      this.renderSegmentation();
    }
  }
  
  /**
   * Render segmentation overlay
   */
  renderSegmentation(): void {
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
    
    // Draw segmentation overlay if enabled and data available
    if (this.showSegmentation && this.segmentationMask) {
      this.drawSegmentationOverlay(ctx, canvas.width, canvas.height);
    }
  }
  
  /**
   * Draw segmentation overlay
   */
  private drawSegmentationOverlay(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (this.segmentationMask) {
      const maskImg = new Image();
      maskImg.onload = () => {
        // Draw mask as overlay with transparency
        ctx.globalAlpha = 0.5;
        ctx.drawImage(maskImg, 0, 0, width, height);
        
        // Draw contour
        this.drawContour(ctx, maskImg, width, height);
        
        ctx.globalAlpha = 1.0;
      };
      maskImg.src = this.segmentationMask;
    } else {
      // Fallback: draw a simple circle (if no real segmentation data)
      this.generateFallbackSegmentation(ctx, width, height);
    }
  }
  
  /**
   * Draw contour from mask
   */
  private drawContour(ctx: CanvasRenderingContext2D, mask: HTMLImageElement, width: number, height: number): void {
    // Create a temporary canvas to process the mask
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    
    if (!tempCtx) return;
    
    tempCtx.drawImage(mask, 0, 0, width, height);
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Find edges and draw contour
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.8;
    
    // Simple edge detection (simplified)
    for (let y = 1; y < height - 1; y += 2) {
      for (let x = 1; x < width - 1; x += 2) {
        const idx = (y * width + x) * 4;
        const isEdge = this.isEdgePixel(data, idx, width);
        
        if (isEdge) {
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(x, y, 2, 2);
        }
      }
    }
    
    ctx.globalAlpha = 1.0;
  }
  
  /**
   * Check if pixel is an edge
   */
  private isEdgePixel(data: Uint8ClampedArray, idx: number, width: number): boolean {
    const current = data[idx] > 128; // Threshold for mask
    const right = data[idx + 4] > 128;
    const bottom = data[(idx + width * 4)] > 128;
    
    return current && (!right || !bottom);
  }
  
  /**
   * Generate fallback segmentation
   */
  private generateFallbackSegmentation(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;
    
    // Draw overlay
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw contour
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();
    
    ctx.globalAlpha = 1.0;
  }
  
  /**
   * Toggle segmentation visibility
   */
  toggleSegmentation(): void {
    this.showSegmentation = !this.showSegmentation;
    this.renderSegmentation();
  }
  
  /**
   * Format measurement value
   */
  formatMeasurement(value?: number, unit: string = 'mm'): string {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(2)} ${unit}`;
  }
  
  /**
   * Get asymmetry label
   */
  getAsymmetryLabel(asymmetry?: number): string {
    if (asymmetry === undefined || asymmetry === null) return 'N/A';
    if (asymmetry < 0.3) return 'Symmetrical';
    if (asymmetry < 0.6) return 'Moderately Asymmetric';
    return 'Highly Asymmetric';
  }
}

