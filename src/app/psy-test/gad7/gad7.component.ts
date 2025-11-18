import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestResultsService } from '../../services/test-results.service';

@Component({
  selector: 'app-gad7',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gad7.component.html',
  styleUrls: ['./gad7.component.scss']
})
export class Gad7Component {
  step: 'intro' | 'questions' | 'impact' | 'result' = 'intro';
  currentQuestionIndex = 0;
  selectedCountry = 'fr';

  questions = [
    { text: 'Feeling nervous, anxious, or on edge', answer: null },
    { text: 'Not being able to stop or control worrying', answer: null },
    { text: 'Worrying too much about different things', answer: null },
    { text: 'Trouble relaxing', answer: null },
    { text: 'Being so restless that it is hard to sit still', answer: null },
    { text: 'Becoming easily annoyed or irritable', answer: null },
    { text: 'Feeling afraid as if something awful might happen', answer: null }
  ];

  options = [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 }
  ];

  impact: number | null = null;
  totalScore = 0;
  interpretation = '';

  constructor(private testResultsService: TestResultsService) {}

  startTest() {
    if (!this.ensureProfileSelected()) {
      return;
    }
    this.step = 'questions';
    this.currentQuestionIndex = 0;
  }

  nextQuestion() {
    const current = this.questions[this.currentQuestionIndex];
    if (current.answer === null) {
      alert('Please select an answer before continuing.');
      return;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.step = 'impact';
    }
  }

  submitForm() {
    if (this.impact === null) {
      alert('Please indicate the impact.');
      return;
    }

    this.totalScore = this.questions.reduce((sum, q) => sum + Number(q.answer), 0);

    if (this.totalScore <= 4) {
      this.interpretation = 'Minimal anxiety';
    } else if (this.totalScore <= 9) {
      this.interpretation = 'Mild anxiety';
    } else if (this.totalScore <= 14) {
      this.interpretation = 'Moderate anxiety';
    } else {
      this.interpretation = 'Severe anxiety';
    }

    this.step = 'result';
    this.saveResult();
  }

  reset() {
    this.questions.forEach(q => q.answer = null);
    this.impact = null;
    this.totalScore = 0;
    this.interpretation = '';
    this.step = 'intro';
    this.currentQuestionIndex = 0;
  }

  private saveResult() {
    const profileId = this.testResultsService.getActiveProfileId();
    const payload = {
      profile_id: profileId,
      test_name: 'GAD7',
      score: this.totalScore,
      interpretation: this.interpretation,
      answers: {
        questions: this.questions.map(q => ({ text: q.text, answer: q.answer })),
        impact: this.impact,
        selectedCountry: this.selectedCountry
      }
    };

    this.testResultsService.saveResult(payload).subscribe({
      error: (err) => console.error('Failed to save GAD-7 result', err)
    });
  }

  private ensureProfileSelected(): boolean {
    if (!this.testResultsService.getActiveProfileId()) {
      alert('Veuillez sélectionner un profil sur la page Tests avant de commencer.');
      return false;
    }
    return true;
  }
}
