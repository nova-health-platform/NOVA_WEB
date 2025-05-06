import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-phq9',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './phq9.component.html',
  styleUrls: ['./phq9.component.scss']
})
export class Phq9Component {
  step: 'intro' | 'questions' | 'impact' | 'result' = 'intro';
  currentQuestionIndex = 0;
  selectedCountry = 'fr';

  questions = [
    { text: 'Little interest or pleasure in doing things', answer: null },
    { text: 'Feeling down, depressed, or hopeless', answer: null },
    { text: 'Trouble falling or staying asleep, or sleeping too much', answer: null },
    { text: 'Feeling tired or having little energy', answer: null },
    { text: 'Poor appetite or overeating', answer: null },
    { text: 'Feeling bad about yourself — or that you are a failure or have let yourself or your family down', answer: null },
    { text: 'Trouble concentrating on things, such as reading the newspaper or watching television', answer: null },
    { text: 'Moving or speaking so slowly that other people could have noticed. Or the opposite — being so fidgety or restless that you have been moving a lot more than usual', answer: null },
    { text: 'Thoughts that you would be better off dead or of hurting yourself in some way', answer: null },
  ];

  options = [
    { label: 'Not at all', value: 0 },
    { label: 'Several days', value: 1 },
    { label: 'More than half the days', value: 2 },
    { label: 'Nearly every day', value: 3 },
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

    if (this.totalScore <= 4) this.interpretation = 'Minimal or no depressive symptoms';
    else if (this.totalScore <= 9) this.interpretation = 'Mild depression';
    else if (this.totalScore <= 14) this.interpretation = 'Moderate depression';
    else if (this.totalScore <= 19) this.interpretation = 'Moderately severe depression';
    else this.interpretation = 'Severe depression';

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
