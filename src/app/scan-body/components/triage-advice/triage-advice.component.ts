import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-triage-advice',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './triage-advice.component.html',
  styleUrl: './triage-advice.component.scss'
})
export class TriageAdviceComponent {
  @Input() riskPercentage: number = 0;
  @Input() customRecommendation?: string;
  
  /**
   * Get risk category
   */
  getRiskCategory(): 'low' | 'moderate' | 'high' {
    if (this.riskPercentage < 20) return 'low';
    if (this.riskPercentage < 50) return 'moderate';
    return 'high';
  }
  
  /**
   * Get triage advice based on risk
   */
  getAdvice(): {
    title: string;
    message: string;
    action: string;
    urgency: 'routine' | 'soon' | 'urgent';
    icon: string;
  } {
    const category = this.getRiskCategory();
    
    if (this.customRecommendation) {
      return {
        title: 'Recommendation',
        message: this.customRecommendation,
        action: this.getActionForCategory(category),
        urgency: this.getUrgencyForCategory(category),
        icon: this.getIconForCategory(category)
      };
    }
    
    switch (category) {
      case 'low':
        return {
          title: 'Low Risk',
          message: 'The analysis indicates a low risk of malignancy. Continue to monitor the lesion and take a follow-up photo in 4 weeks to track any changes.',
          action: 'Monitor and retake photo in 4 weeks',
          urgency: 'routine',
          icon: '✓'
        };
      case 'moderate':
        return {
          title: 'Moderate Risk',
          message: 'The analysis indicates a moderate risk. It is recommended to schedule an appointment with a dermatologist for proper evaluation and diagnosis.',
          action: 'Schedule a dermatologist appointment soon',
          urgency: 'soon',
          icon: '⚠'
        };
      case 'high':
        return {
          title: 'High Risk',
          message: 'The analysis indicates a high risk of malignancy. Please consult with a healthcare professional as soon as possible for immediate evaluation and treatment planning.',
          action: 'Consult a healthcare professional promptly',
          urgency: 'urgent',
          icon: '⚡'
        };
    }
  }
  
  private getActionForCategory(category: 'low' | 'moderate' | 'high'): string {
    switch (category) {
      case 'low': return 'Monitor and retake photo in 4 weeks';
      case 'moderate': return 'Schedule a dermatologist appointment soon';
      case 'high': return 'Consult a healthcare professional promptly';
    }
  }
  
  private getUrgencyForCategory(category: 'low' | 'moderate' | 'high'): 'routine' | 'soon' | 'urgent' {
    switch (category) {
      case 'low': return 'routine';
      case 'moderate': return 'soon';
      case 'high': return 'urgent';
    }
  }
  
  private getIconForCategory(category: 'low' | 'moderate' | 'high'): string {
    switch (category) {
      case 'low': return '✓';
      case 'moderate': return '⚠';
      case 'high': return '⚡';
    }
  }
  
  /**
   * Get color classes based on urgency
   */
  getColorClasses(): string {
    const urgency = this.getAdvice().urgency;
    switch (urgency) {
      case 'routine':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'soon':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'urgent':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  }
}

