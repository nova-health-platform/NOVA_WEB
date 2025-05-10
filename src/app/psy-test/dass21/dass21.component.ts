import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dass21',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dass21.component.html',
  styleUrls: ['./dass21.component.scss']
})
export class Dass21Component {
  step: 'intro' | 'questions' | 'result' = 'intro';
  currentQuestionIndex = 0;

  questions = [
    { text: 'I found it hard to wind down', answer: null },
    { text: 'I was aware of dryness of my mouth', answer: null },
    { text: 'I couldn’t seem to experience any positive feeling at all', answer: null },
    { text: 'I experienced breathing difficulty (e.g., excessively rapid breathing, breathlessness)', answer: null },
    { text: 'I found it difficult to work up the initiative to do things', answer: null },
    { text: 'I tended to over-react to situations', answer: null },
    { text: 'I experienced trembling (e.g., in the hands)', answer: null },
    { text: 'I felt that I was using a lot of nervous energy', answer: null },
    { text: 'I was worried about situations in which I might panic and make a fool of myself', answer: null },
    { text: 'I felt that I had nothing to look forward to', answer: null },
    { text: 'I found myself getting agitated', answer: null },
    { text: 'I found it difficult to relax', answer: null },
    { text: 'I felt down-hearted and blue', answer: null },
    { text: 'I was intolerant of anything that kept me from getting on with what I was doing', answer: null },
    { text: 'I felt I was close to panic', answer: null },
    { text: 'I was unable to become enthusiastic about anything', answer: null },
    { text: 'I felt I wasn’t worth much as a person', answer: null },
    { text: 'I felt that I was rather touchy', answer: null },
    { text: 'I was aware of the action of my heart in the absence of physical exertion', answer: null },
    { text: 'I felt scared without any good reason', answer: null },
    { text: 'I felt that life was meaningless', answer: null }
  ];

  options = [
    { label: 'Did not apply to me at all', value: 0 },
    { label: 'Applied to me to some degree, or some of the time', value: 1 },
    { label: 'Applied to me to a considerable degree, or a good part of time', value: 2 },
    { label: 'Applied to me very much or most of the time', value: 3 }
  ];

  depressionScore = 0;
  anxietyScore = 0;
  stressScore = 0;

  depressionLabel = '';
  anxietyLabel = '';
  stressLabel = '';

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
      this.calculateResults();
    }
  }

  calculateResults() {
    const depressionIndices = [2, 4, 9, 12, 15, 16, 20];
    const anxietyIndices = [1, 3, 6, 8, 14, 18, 19];
    const stressIndices = [0, 5, 7, 10, 11, 13, 17];

    const sum = (indices: number[]) =>
      indices.reduce((acc, i) => acc + Number(this.questions[i].answer), 0) * 2;

    this.depressionScore = sum(depressionIndices);
    this.anxietyScore = sum(anxietyIndices);
    this.stressScore = sum(stressIndices);

    this.depressionLabel = this.getDepressionLabel(this.depressionScore);
    this.anxietyLabel = this.getAnxietyLabel(this.anxietyScore);
    this.stressLabel = this.getStressLabel(this.stressScore);

    this.step = 'result';
  }

  getDepressionLabel(score: number): string {
    if (score <= 9) return 'Normal';
    else if (score <= 13) return 'Mild';
    else if (score <= 20) return 'Moderate';
    else if (score <= 27) return 'Severe';
    else return 'Extremely Severe';
  }

  getAnxietyLabel(score: number): string {
    if (score <= 7) return 'Normal';
    else if (score <= 9) return 'Mild';
    else if (score <= 14) return 'Moderate';
    else if (score <= 19) return 'Severe';
    else return 'Extremely Severe';
  }

  getStressLabel(score: number): string {
    if (score <= 14) return 'Normal';
    else if (score <= 18) return 'Mild';
    else if (score <= 25) return 'Moderate';
    else if (score <= 33) return 'Severe';
    else return 'Extremely Severe';
  }

  reset() {
    this.questions.forEach(q => q.answer = null);
    this.currentQuestionIndex = 0;
    this.depressionScore = 0;
    this.anxietyScore = 0;
    this.stressScore = 0;
    this.depressionLabel = '';
    this.anxietyLabel = '';
    this.stressLabel = '';
    this.step = 'intro';
  }
}