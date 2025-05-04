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
  submitted = false;
  totalScore = 0;
  interpretation = '';

  submitForm() {
    if (this.questions.some(q => q.answer === null) || this.impact === null) {
      alert('Please answer all questions before submitting.');
      return;
    }

    this.totalScore = this.questions.reduce((sum, q) => sum + Number(q.answer), 0);

    if (this.totalScore <= 4) this.interpretation = 'Minimal or no depressive symptoms';
    else if (this.totalScore <= 9) this.interpretation = 'Mild depression';
    else if (this.totalScore <= 14) this.interpretation = 'Moderate depression';
    else if (this.totalScore <= 19) this.interpretation = 'Moderately severe depression';
    else this.interpretation = 'Severe depression';

    this.submitted = true;
  }

  reset() {
    this.questions.forEach(q => q.answer = null);
    this.impact = null;
    this.submitted = false;
    this.totalScore = 0;
    this.interpretation = '';
  }
}
