import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ClarificationItem {
  symptom: string;
  question: string;
}

interface SvgPath {
  id: string;
  d: string;
}

@Component({
  selector: 'app-analysis',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './analysis.component.html',
  styleUrls: ['./analysis.component.scss']
})
export class AnalysisComponent implements OnInit {
  symptoms: string[] = [];
  searchQuery: string = '';
  filteredSymptoms: string[] = [];
  selectedSymptoms: string[] = [];

  response: any = null;
  loading = false;
  errorMessage = '';

  currentClarification: ClarificationItem | null = null;
  state: { [symptom: string]: boolean } = {};
  askedQuestions: string[] = [];

  age: number | null = null;
  gender: string = '';

  svgPaths: SvgPath[] = [];

  // UI control flags
  showPainQuestion: boolean = false;
  painAnswer: boolean | null = null;
  showBodySelection: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSymptoms();
    this.loadSvgPaths();
  }

  loadSymptoms(): void {
    this.http.get<string[]>('http://localhost:5000/api/symptoms').subscribe({
      next: (data) => this.symptoms = data,
      error: (err) => console.error('Error loading symptoms:', err)
    });
  }

  loadSvgPaths(): void {
    this.http.get<SvgPath[]>('assets/pain_location_front.json').subscribe({
      next: (data) => this.svgPaths = data,
      error: (err) => console.error('Error loading SVG paths:', err)
    });
  }

  toggleZone(event: MouseEvent, id: string): void {
    if (id === 'body') return;

    const target = event.target as SVGPathElement;
    const currentFill = target.getAttribute('fill');

    if (currentFill === '#ff0000') {
      target.setAttribute('fill', '#ec4899'); // pink
    } else {
      target.setAttribute('fill', '#ff0000'); // red
    }
  }

  filterSymptoms(): void {
    const query = this.searchQuery.toLowerCase();
    this.filteredSymptoms = this.symptoms
      .filter(symptom => symptom.toLowerCase().includes(query))
      .slice(0, 10);
  }

  addSymptom(symptom?: string): void {
    const finalSymptom = (symptom || this.searchQuery).trim();
    if (finalSymptom && !this.selectedSymptoms.includes(finalSymptom)) {
      this.selectedSymptoms.push(finalSymptom);
    }
    this.searchQuery = '';
    this.filteredSymptoms = [];
  }

  removeSymptom(index: number): void {
    this.selectedSymptoms.splice(index, 1);
  }

  formatSymptoms(symptoms: string[]): string[] {
    return symptoms.map(symptom =>
      symptom.toLowerCase().trim().replace(/ /g, '_')
    );
  }

  submitSymptoms(): void {
    if (this.selectedSymptoms.length === 0) {
      this.errorMessage = 'Please select at least one symptom.';
      return;
    }

    if (!this.age || !this.gender) {
      this.errorMessage = 'Please enter your age and gender.';
      return;
    }

    // Ask the pain question first
    this.errorMessage = '';
    this.showPainQuestion = true;
  }

  answerPainQuestion(answer: boolean): void {
    this.painAnswer = answer;
    this.showPainQuestion = false;

    if (answer) {
      // Show body silhouette for pain selection
      this.showBodySelection = true;
    } else {
      // Skip to API submission
      this.submitSymptomsToApi();
    }
  }

  validateBodySelection(): void {
    this.showBodySelection = false;
    this.submitSymptomsToApi();
  }

  submitSymptomsToApi(): void {
    this.loading = true;
    this.errorMessage = '';

    const formattedSymptoms = this.formatSymptoms(this.selectedSymptoms);

    this.http.post<any>('http://localhost:5000/api/nova/start', {
      symptoms: formattedSymptoms,
      age: this.age,
      gender: this.gender
    }).subscribe({
      next: (data) => {
        this.state = data.state || {};
        this.askedQuestions = data.question ? [data.question.question] : [];
        this.currentClarification = data.question || null;
        this.response = null;
        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'An error occurred during the analysis.';
        this.loading = false;
      }
    });
  }

  answerClarification(value: boolean): void {
    if (!this.currentClarification) return;

    const answerPayload = {
      state: this.state,
      answer: {
        [this.currentClarification.symptom]: value
      },
      asked_questions: [...this.askedQuestions, this.currentClarification.question]
    };

    this.loading = true;
    this.http.post<any>('http://localhost:5000/api/nova/refine', answerPayload).subscribe({
      next: (data) => {
        this.state = data.state || {};
        this.askedQuestions = data.asked_questions || [];

        if (data.final_prediction) {
          this.response = {
            predicted_disease: data.final_prediction,
            confidence: data.confidence
          };
          this.currentClarification = null;
        } else {
          this.currentClarification = data.question || null;
          if (this.currentClarification?.question) {
            this.askedQuestions.push(this.currentClarification.question);
          }
        }

        this.loading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'An error occurred during clarification.';
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.response = null;
    this.selectedSymptoms = [];
    this.searchQuery = '';
    this.filteredSymptoms = [];
    this.currentClarification = null;
    this.askedQuestions = [];
    this.state = {};
    this.errorMessage = '';
    this.age = null;
    this.gender = '';
    this.showPainQuestion = false;
    this.painAnswer = null;
    this.showBodySelection = false;
  }
}
