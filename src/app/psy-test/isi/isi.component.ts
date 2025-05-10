import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-isi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './isi.component.html',
  styleUrls: ['./isi.component.scss']
})
export class IsiComponent {
  step: 'intro' | 'questions' | 'impact' | 'result' = 'intro';
  currentQuestionIndex = 0;
  selectedCountry = 'fr';

  questions = [
    { text: 'Difficulty falling asleep', answer: null },
    { text: 'Difficulty staying asleep', answer: null },
    { text: 'Problems waking up too early', answer: null },
    { text: 'How satisfied/dissatisfied are you with your current sleep pattern?', answer: null },
    { text: 'How noticeable is your sleep problem to others in terms of impairing the quality of your life?', answer: null },
    { text: 'How worried/distressed are you about your current sleep problem?', answer: null },
    { text: 'To what extent do you consider your sleep problem to interfere with your daily functioning?', answer: null },
  ];

  options = [
    { label: 'None', value: 0 },
    { label: 'Mild', value: 1 },
    { label: 'Moderate', value: 2 },
    { label: 'Severe', value: 3 },
    { label: 'Very severe', value: 4 },
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

    if (this.totalScore <= 7) this.interpretation = 'No clinically significant insomnia';
    else if (this.totalScore <= 14) this.interpretation = 'Subthreshold insomnia';
    else if (this.totalScore <= 21) this.interpretation = 'Moderate severity insomnia';
    else this.interpretation = 'Severe insomnia';

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
