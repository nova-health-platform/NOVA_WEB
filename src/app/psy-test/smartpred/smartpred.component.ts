import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TestResultsService } from '../../services/test-results.service';

interface SummaryResponse {
  overallScore: number;
  overallInterpretation: string;
  summary: {
    totalTests: number;
    lastUpdated: string | null;
  };
  patterns: string[];
  risks: string[];
  immediateActions: string[];
  longTermStrategies: string[];
  professionalAdvice: string;
  breakdown: Array<{
    id: number;
    test_name: string;
    score: number;
    normalized_score: number;
    interpretation: string;
    created_at: string | null;
  }>;
}

@Component({
  selector: 'app-smartpred',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './smartpred.component.html',
  styleUrls: ['./smartpred.component.scss']
})
export class SmartpredComponent {
  step: 'intro' | 'analyzing' | 'result' = 'intro';
  overallScore = 0;
  overallInterpretation = '';
  patterns: string[] = [];
  risks: string[] = [];
  immediateActions: string[] = [];
  longTermStrategies: string[] = [];
  professionalAdvice = '';
  summary: SummaryResponse['summary'] | null = null;
  breakdown: SummaryResponse['breakdown'] = [];
  analysisError = '';

  constructor(private testResultsService: TestResultsService) {}

  startAnalysis() {
    if (!this.ensureProfileSelected()) {
      return;
    }
    this.analysisError = '';
    this.step = 'analyzing';

    setTimeout(() => {
      this.fetchSummary();
    }, 1500);
  }

  private fetchSummary() {
    const profileId = this.testResultsService.getActiveProfileId();

    if (!profileId) {
      this.analysisError = 'Please select a profile with saved tests.';
      this.step = 'intro';
      return;
    }

    this.testResultsService.getTestSummary(profileId).subscribe({
      next: (summary: SummaryResponse | null) => {
        if (!summary) {
          this.analysisError = 'Session expired. Please log in again.';
          this.step = 'intro';
          return;
        }
        this.applySummary(summary);
        this.step = 'result';
      },
      error: (error) => {
        if (error.status === 404) {
          this.analysisError = 'No tests saved for this profile.';
        } else if (error.status === 401) {
          this.analysisError = 'Session expired. Please log in again.';
        } else {
          this.analysisError = 'Unable to retrieve analysis. Please try again later.';
        }
        this.step = 'intro';
      }
    });
  }

  exportResults() {
    const results = {
      overallScore: this.overallScore,
      interpretation: this.overallInterpretation,
      patterns: this.patterns,
      risks: this.risks,
      immediateActions: this.immediateActions,
      longTermStrategies: this.longTermStrategies,
      professionalAdvice: this.professionalAdvice,
      breakdown: this.breakdown,
      summary: this.summary,
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
    this.patterns = [];
    this.risks = [];
    this.immediateActions = [];
    this.longTermStrategies = [];
    this.professionalAdvice = '';
    this.breakdown = [];
    this.summary = null;
    this.analysisError = '';
  }

  private applySummary(summary: SummaryResponse) {
    this.overallScore = summary.overallScore;
    this.overallInterpretation = summary.overallInterpretation;
    this.patterns = summary.patterns || [];
    this.risks = summary.risks || [];
    this.immediateActions = summary.immediateActions || [];
    this.longTermStrategies = summary.longTermStrategies || [];
    this.professionalAdvice = summary.professionalAdvice;
    this.summary = summary.summary;
    this.breakdown = summary.breakdown || [];
  }

  private ensureProfileSelected(): boolean {
    if (!this.testResultsService.getActiveProfileId()) {
      this.analysisError = 'Select a profile from the Tests page before launching Smart Prediction.';
      return false;
    }
    return true;
  }
}
