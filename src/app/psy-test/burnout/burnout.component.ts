import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-burnout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './burnout.component.html',
  styleUrls: ['./burnout.component.scss']
})
export class BurnoutComponent {
  step: 'intro' | 'questions' | 'impact' | 'result' = 'intro';
  currentQuestionIndex = 0;
  selectedCountry = 'fr';

  questions = [
    { text: 'I feel emotionally drained from my work', answer: null },
    { text: 'I feel used up at the end of the workday', answer: null },
    { text: 'I feel tired when I get up in the morning and have to face another day on the job', answer: null },
    { text: 'Working all day is really a strain for me', answer: null },
    { text: 'I feel I’m positively influencing other people’s lives through my work', answer: null },
    { text: 'I’ve become more callous toward people since I took this job', answer: null },
    { text: 'I worry that this job is hardening me emotionally', answer: null },
    { text: 'I feel frustrated by my job', answer: null },
    { text: 'I feel I’m not achieving worthwhile things in my job', answer: null },
  ];

  options = [
    { label: 'Never', value: 0 },
    { label: 'A few times a year', value: 1 },
    { label: 'Once a month or less', value: 2 },
    { label: 'A few times a month', value: 3 },
    { label: 'Once a week', value: 4 },
    { label: 'A few times a week', value: 5 },
    { label: 'Every day', value: 6 },
  ];

  impact: number | null = null;
  totalScore = 0;
  interpretation = '';

  startTest() {
    this.step = 'questions';
    this.currentQuestionIndex = 0;
  }

  nextQuestion() {
    if (this.questions[this.currentQuestionIndex].answer === null) {
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

    if (this.totalScore <= 18) {
      this.interpretation = 'Low risk of burnout';
    } else if (this.totalScore <= 36) {
      this.interpretation = 'Moderate signs of burnout';
    } else {
      this.interpretation = 'High risk of burnout – please consider support or professional help';
    }

    this.step = 'result';
  }

  reset() {
    this.questions.forEach(q => q.answer = null);
    this.impact = null;
    this.totalScore = 0;
    this.interpretation = '';
    this.step = 'intro';
    this.currentQuestionIndex = 0;
  }
}
