import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-risk-score',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './risk-score.component.html',
  styleUrl: './risk-score.component.scss'
})
export class RiskScoreComponent {
  @Input() riskPercentage: number = 0;
  @Input() showLabel: boolean = true;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  /**
   * Get risk category based on percentage
   */
  getRiskCategory(): 'low' | 'moderate' | 'high' {
    if (this.riskPercentage < 20) return 'low';
    if (this.riskPercentage < 50) return 'moderate';
    return 'high';
  }
  
  /**
   * Get risk label
   */
  getRiskLabel(): string {
    const category = this.getRiskCategory();
    switch (category) {
      case 'low': return 'Low Risk';
      case 'moderate': return 'Moderate Risk';
      case 'high': return 'High Risk';
    }
  }
  
  /**
   * Get color classes based on risk
   */
  getColorClasses(): string {
    const category = this.getRiskCategory();
    switch (category) {
      case 'low':
        return 'bg-green-500/20 border-green-500/30 text-green-400';
      case 'moderate':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
      case 'high':
        return 'bg-red-500/20 border-red-500/30 text-red-400';
    }
  }
  
  /**
   * Get gauge color
   */
  getGaugeColor(): string {
    const category = this.getRiskCategory();
    switch (category) {
      case 'low': return '#22c55e'; // green-500
      case 'moderate': return '#eab308'; // yellow-500
      case 'high': return '#ef4444'; // red-500
    }
  }
  
  /**
   * Get size classes
   */
  getSizeClasses(): { text: string; gauge: string } {
    switch (this.size) {
      case 'small':
        return { 
          text: 'text-lg', 
          gauge: 'w-16 h-16' 
        };
      case 'large':
        return { 
          text: 'text-4xl', 
          gauge: 'w-32 h-32' 
        };
      default: // medium
        return { 
          text: 'text-3xl', 
          gauge: 'w-24 h-24' 
        };
    }
  }
  
  /**
   * Get circumference for circle
   */
  getCircumference(): number {
    const radius = this.size === 'small' ? 28 : this.size === 'large' ? 56 : 42;
    return 2 * Math.PI * radius;
  }
}

