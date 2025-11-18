import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TestResultsService } from '../../services/test-results.service';

@Component({
  selector: 'app-dass21',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dass21.component.html',
  styleUrls: ['./dass21.component.scss']
})
export class Dass21Component {
  step: 'intro' | 'demographics' | 'questions' | 'tipi' | 'vcl' | 'result' = 'intro';
  currentQuestionIndex = 0;
  currentIndex = 0;
  tipiIndex = 0;
  
  // Progress calculation
  get progress(): number {
    const totalSteps = 6; // intro, demographics, questions, tipi, vcl, result
    let currentStep = 0;
    
    switch (this.step) {
      case 'intro': currentStep = 0; break;
      case 'demographics': currentStep = 1; break;
      case 'questions': currentStep = 2; break;
      case 'tipi': currentStep = 3; break;
      case 'vcl': currentStep = 4; break;
      case 'result': currentStep = 5; break;
    }
    
    return (currentStep / (totalSteps - 1)) * 100;
  }

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

  // Demographics
  demographics = {
    age: null,
    gender: null,
    education: null,
    urban: null,
    married: null,
    familysize: null
  };

  // TIPI questions
  tipiQuestions = [
    'I see myself as extraverted, enthusiastic.',
    'I see myself as critical, quarrelsome.',
    'I see myself as dependable, self-disciplined.',
    'I see myself as anxious, easily upset.',
    'I see myself as open to new experiences, complex.',
    'I see myself as reserved, quiet.',
    'I see myself as sympathetic, warm.',
    'I see myself as disorganized, careless.',
    'I see myself as calm, emotionally stable.',
    'I see myself as conventional, uncreative.'
  ];

  tipi: (number | null)[] = new Array(10).fill(null);

  // VCL words
  vclWords = [
    'boat', 'incoherent', 'pallid', 'robot', 'audible', 'cuivocal', 'paucity', 'epistemology', 'florted', 'decide', 'pastiche', 'verdid', 'abysmal', 'lucid', 'betray', 'funny'
  ];

  vcl: boolean[] = new Array(16).fill(false);

  constructor(private testResultsService: TestResultsService) {}

  startTest() {
    if (!this.ensureProfileSelected()) {
      return;
    }
    this.step = 'demographics';
    this.currentIndex = 0;
  }

  nextDemographicStep() {
    if (this.currentIndex < 5) {
      this.currentIndex++;
    } else {
      this.step = 'questions';
      this.currentQuestionIndex = 0;
    }
  }

  nextTipiQuestion() {
    if (this.tipiIndex < 9) {
      this.tipiIndex++;
    } else {
      this.step = 'vcl';
    }
  }

  submitVCL() {
    this.calculateResults();
  }

  nextQuestion() {
    if (this.questions[this.currentQuestionIndex].answer === null) {
      alert('Please select an answer before continuing.');
      return;
    }

    if (this.currentQuestionIndex < this.questions.length - 1) {
      this.currentQuestionIndex++;
    } else {
      this.step = 'tipi';
      this.tipiIndex = 0;
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
    this.saveResult();
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
    this.currentIndex = 0;
    this.tipiIndex = 0;
    this.depressionScore = 0;
    this.anxietyScore = 0;
    this.stressScore = 0;
    this.depressionLabel = '';
    this.anxietyLabel = '';
    this.stressLabel = '';
    
    // Reset demographics
    this.demographics = {
      age: null,
      gender: null,
      education: null,
      urban: null,
      married: null,
      familysize: null
    };
    
    // Reset TIPI
    this.tipi = new Array(10).fill(null);
    
    // Reset VCL
    this.vcl = new Array(16).fill(false);
    
    this.step = 'intro';
  }

  isCurrentDemographicValid(): boolean {
    switch (this.currentIndex) {
      case 0:
        return this.demographics.age !== null && Number(this.demographics.age) > 0;
      case 1:
        return this.demographics.gender !== null;
      case 2:
        return this.demographics.education !== null;
      case 3:
        return this.demographics.urban !== null;
      case 4:
        return this.demographics.married !== null;
      case 5:
        return this.demographics.familysize !== null && Number(this.demographics.familysize) > 0;
      default:
        return false;
    }
  }

  isCurrentQuestionAnswered(): boolean {
    return this.questions[this.currentQuestionIndex].answer !== null;
  }

  isCurrentTipiAnswered(): boolean {
    return this.tipi[this.tipiIndex] !== null;
  }

  private saveResult() {
    const profileId = this.testResultsService.getActiveProfileId();
    const payload = {
      profile_id: profileId,
      test_name: 'DASS21',
      score: this.depressionScore + this.anxietyScore + this.stressScore,
      interpretation: `Depression: ${this.depressionLabel} | Anxiety: ${this.anxietyLabel} | Stress: ${this.stressLabel}`,
      answers: {
        demographics: this.demographics,
        questions: this.questions.map(q => ({ text: q.text, answer: q.answer })),
        tipi: this.tipi,
        vcl: this.vcl
      }
    };

    this.testResultsService.saveResult(payload).subscribe({
      error: (err) => console.error('Failed to save DASS-21 result', err)
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