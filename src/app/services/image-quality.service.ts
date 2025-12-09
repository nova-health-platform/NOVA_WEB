import { Injectable } from '@angular/core';

export interface ImageQualityMetrics {
  isBlurry: boolean;
  blurScore: number; // 0-1, higher = sharper
  isTooDark: boolean;
  isTooBright: boolean;
  brightnessScore: number; // 0-1, optimal around 0.5
  isFramedCorrectly: boolean;
  framingScore: number; // 0-1, based on lesion centering
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ImageQualityService {
  
  /**
   * Analyze image quality and provide recommendations
   */
  async analyzeImageQuality(file: File | Blob): Promise<ImageQualityMetrics> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e: any) => {
        try {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Could not create canvas context'));
              return;
            }
            
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Analyze blur
            const blurAnalysis = this.analyzeBlur(imageData);
            
            // Analyze brightness
            const brightnessAnalysis = this.analyzeBrightness(imageData);
            
            // Analyze framing (simplified - check if lesion is centered)
            const framingAnalysis = this.analyzeFraming(imageData);
            
            // Determine overall quality
            const overallQuality = this.determineOverallQuality(
              blurAnalysis.score,
              brightnessAnalysis.score,
              framingAnalysis.score
            );
            
            // Generate recommendations
            const recommendations = this.generateRecommendations(
              blurAnalysis.isBlurry,
              brightnessAnalysis.isTooDark,
              brightnessAnalysis.isTooBright,
              framingAnalysis.isFramedCorrectly
            );
            
            resolve({
              isBlurry: blurAnalysis.isBlurry,
              blurScore: blurAnalysis.score,
              isTooDark: brightnessAnalysis.isTooDark,
              isTooBright: brightnessAnalysis.isTooBright,
              brightnessScore: brightnessAnalysis.score,
              isFramedCorrectly: framingAnalysis.isFramedCorrectly,
              framingScore: framingAnalysis.score,
              overallQuality,
              recommendations
            });
          };
          
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = e.target.result as string;
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Analyze blur using Laplacian variance (simplified)
   */
  private analyzeBlur(imageData: ImageData): { isBlurry: boolean; score: number } {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    
    let laplacianSum = 0;
    let sampleCount = 0;
    
    // Sample pixels for performance (check every 4th pixel)
    for (let y = 1; y < height - 1; y += 4) {
      for (let x = 1; x < width - 1; x += 4) {
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        // Get neighbors
        const left = ((y * width + (x - 1)) * 4);
        const right = ((y * width + (x + 1)) * 4);
        const top = (((y - 1) * width + x) * 4);
        const bottom = (((y + 1) * width + x) * 4);
        
        const grayLeft = (data[left] + data[left + 1] + data[left + 2]) / 3;
        const grayRight = (data[right] + data[right + 1] + data[right + 2]) / 3;
        const grayTop = (data[top] + data[top + 1] + data[top + 2]) / 3;
        const grayBottom = (data[bottom] + data[bottom + 1] + data[bottom + 2]) / 3;
        
        // Laplacian approximation
        const laplacian = Math.abs(4 * gray - grayLeft - grayRight - grayTop - grayBottom);
        laplacianSum += laplacian;
        sampleCount++;
      }
    }
    
    const variance = laplacianSum / sampleCount;
    
    // Threshold: variance < 100 is usually blurry
    // Normalize to 0-1 scale (assuming max variance ~500 for sharp images)
    const score = Math.min(variance / 500, 1);
    const isBlurry = variance < 100;
    
    return { isBlurry, score };
  }
  
  /**
   * Analyze brightness
   */
  private analyzeBrightness(imageData: ImageData): { 
    isTooDark: boolean; 
    isTooBright: boolean; 
    score: number 
  } {
    const data = imageData.data;
    const pixelCount = data.length / 4;
    let totalBrightness = 0;
    
    // Sample every 10th pixel for performance
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const gray = (r + g + b) / 3;
      totalBrightness += gray / 255;
    }
    
    const avgBrightness = totalBrightness / (pixelCount / 10);
    
    // Optimal brightness: 0.3-0.7 (30-70%)
    const isTooDark = avgBrightness < 0.3;
    const isTooBright = avgBrightness > 0.7;
    
    // Score: 1.0 = optimal (0.5), decreases as it moves away
    let score = 1 - Math.abs(avgBrightness - 0.5) * 2;
    score = Math.max(0, Math.min(1, score));
    
    return { isTooDark, isTooBright, score };
  }
  
  /**
   * Analyze framing (simplified - checks edge distribution)
   */
  private analyzeFraming(imageData: ImageData): { 
    isFramedCorrectly: boolean; 
    score: number 
  } {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Check edge regions (outer 20% of image)
    const edgeWidth = Math.floor(width * 0.2);
    const edgeHeight = Math.floor(height * 0.2);
    
    let edgeVariance = 0;
    let centerVariance = 0;
    let edgeSampleCount = 0;
    let centerSampleCount = 0;
    
    // Sample edge regions
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        const isEdge = x < edgeWidth || x > width - edgeWidth || 
                      y < edgeHeight || y > height - edgeHeight;
        
        const idx = (y * width + x) * 4;
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        
        if (isEdge) {
          edgeVariance += gray;
          edgeSampleCount++;
        } else {
          centerVariance += gray;
          centerSampleCount++;
        }
      }
    }
    
    const edgeAvg = edgeVariance / edgeSampleCount;
    const centerAvg = centerVariance / centerSampleCount;
    
    // Good framing: center should have different brightness than edges
    // (indicates a centered subject)
    const contrast = Math.abs(centerAvg - edgeAvg) / 255;
    
    // Score based on contrast (0.1 = minimum contrast for acceptable framing)
    const score = Math.min(contrast / 0.1, 1);
    const isFramedCorrectly = contrast > 0.05;
    
    return { isFramedCorrectly, score };
  }
  
  /**
   * Determine overall quality
   */
  private determineOverallQuality(
    blurScore: number,
    brightnessScore: number,
    framingScore: number
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    const avgScore = (blurScore + brightnessScore + framingScore) / 3;
    
    if (avgScore >= 0.8) return 'excellent';
    if (avgScore >= 0.6) return 'good';
    if (avgScore >= 0.4) return 'fair';
    return 'poor';
  }
  
  /**
   * Generate recommendations
   */
  private generateRecommendations(
    isBlurry: boolean,
    isTooDark: boolean,
    isTooBright: boolean,
    isFramedCorrectly: boolean
  ): string[] {
    const recommendations: string[] = [];
    
    if (isBlurry) {
      recommendations.push('Image appears blurry. Please retake the photo with better focus.');
    }
    
    if (isTooDark) {
      recommendations.push('Image is too dark. Please improve lighting and retake the photo.');
    }
    
    if (isTooBright) {
      recommendations.push('Image is overexposed. Please reduce lighting and retake the photo.');
    }
    
    if (!isFramedCorrectly) {
      recommendations.push('Please center the lesion in the frame for better analysis.');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Image quality looks good. You can proceed with the analysis.');
    }
    
    return recommendations;
  }
}

