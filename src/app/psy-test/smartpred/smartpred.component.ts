import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-smartpred',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './smartpred.component.html',
  styleUrls: ['./smartpred.component.scss']
})
export class SmartpredComponent {
  step: 'intro' | 'analyzing' | 'result' = 'intro';
  // AI Analysis Results
  overallScore = 0;
  overallInterpretation = '';
  pattern1 = '';
  pattern2 = '';
  pattern3 = '';
  risk1 = '';
  risk2 = '';
  risk3 = '';
  immediateAction1 = '';
  immediateAction2 = '';
  longTermStrategy1 = '';
  longTermStrategy2 = '';
  professionalAdvice = '';


  constructor(private http: HttpClient) {}

  startAnalysis() {
    this.step = 'analyzing';
    
    // Simulate AI analysis with realistic data
    setTimeout(() => {
      this.generateMockResults();
      this.step = 'result';
    }, 3000);
  }

  private generateMockResults() {
    // Generate realistic mock data for demonstration
    this.overallScore = Math.floor(Math.random() * 40) + 60; // 60-100 range
    
    if (this.overallScore >= 80) {
      this.overallInterpretation = 'Excellent mental health indicators';
    } else if (this.overallScore >= 70) {
      this.overallInterpretation = 'Good mental health with minor areas for improvement';
    } else if (this.overallScore >= 60) {
      this.overallInterpretation = 'Moderate mental health with some concerns';
    } else {
      this.overallInterpretation = 'Significant mental health concerns detected';
    }

    this.pattern1 = 'Consistent stress patterns during work hours';
    this.pattern2 = 'Positive correlation between sleep quality and mood';
    this.pattern3 = 'Social support appears to be a protective factor';

    this.risk1 = 'Work-related stress levels are elevated';
    this.risk2 = 'Sleep quality could be improved';
    this.risk3 = 'Limited coping strategies identified';

    this.immediateAction1 = 'Practice 10 minutes of daily mindfulness meditation';
    this.immediateAction2 = 'Establish a consistent sleep schedule';

    this.longTermStrategy1 = 'Develop stress management techniques';
    this.longTermStrategy2 = 'Build stronger social support networks';

    this.professionalAdvice = 'Consider speaking with a mental health professional if symptoms persist or worsen over time.';
  }

  exportResults() {
    const results = {
      overallScore: this.overallScore,
      interpretation: this.overallInterpretation,
      patterns: [this.pattern1, this.pattern2, this.pattern3],
      risks: [this.risk1, this.risk2, this.risk3],
      immediateActions: [this.immediateAction1, this.immediateAction2],
      longTermStrategies: [this.longTermStrategy1, this.longTermStrategy2],
      professionalAdvice: this.professionalAdvice,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'mental-health-analysis.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  reset() {
    this.step = 'intro';
    this.overallScore = 0;
    this.overallInterpretation = '';
    this.pattern1 = '';
    this.pattern2 = '';
    this.pattern3 = '';
    this.risk1 = '';
    this.risk2 = '';
    this.risk3 = '';
    this.immediateAction1 = '';
    this.immediateAction2 = '';
    this.longTermStrategy1 = '';
    this.longTermStrategy2 = '';
    this.professionalAdvice = '';
  }
}
