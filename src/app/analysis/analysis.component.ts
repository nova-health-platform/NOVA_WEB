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

  response: {
    predicted_disease: string;
    confidence: number;
    disease_info: any;
    bmi: number;
    painZonesExpanded: string[];
  } | null = null;

  loading = false;
  errorMessage = '';

  currentClarification: ClarificationItem | null = null;
  state: { [symptom: string]: boolean } = {};
  askedQuestions: string[] = [];

  age: number | null = null;
  sex: string = '';
  weight: number | null = null;
  height: number | null = null;

  svgPaths: SvgPath[] = [];
  showPainQuestion: boolean = false;
  painAnswer: boolean | null = null;
  showBodySelection: boolean = false;
  selectedPainLocations: string[] = [];

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
    const index = this.selectedPainLocations.indexOf(id);
    if (index === -1) {
      this.selectedPainLocations.push(id);
    } else {
      this.selectedPainLocations.splice(index, 1);
    }
    const target = event.target as SVGPathElement;
    const currentFill = target.getAttribute('fill');
    if (currentFill === '#ff0000') {
      target.setAttribute('fill', '#ec4899');
    } else {
      target.setAttribute('fill', '#ff0000');
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
    if (!this.age || !this.sex || !this.weight || !this.height) {
      this.errorMessage = 'Please enter your age, gender, weight and height.';
      return;
    }
    this.errorMessage = '';
    this.showPainQuestion = true;
  }

  answerPainQuestion(answer: boolean): void {
    this.painAnswer = answer;
    this.showPainQuestion = false;
    if (answer) {
      this.showBodySelection = true;
    } else {
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
    const requestData = {
      symptoms: formattedSymptoms,
      age: this.age !== null ? Number(this.age) : null,
      sex: this.sex,
      weight: this.weight !== null ? Number(this.weight) : null,
      height: this.height !== null ? Number(this.height) : null,
      painLocations: this.selectedPainLocations
    };

    this.http.post<any>('http://localhost:5000/api/nova/start', requestData).subscribe({
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
      asked_questions: [...this.askedQuestions, this.currentClarification.question],
      age: this.age !== null ? Number(this.age) : null,
      sex: this.sex,
      weight: this.weight !== null ? Number(this.weight) : null,
      height: this.height !== null ? Number(this.height) : null,
      painLocations: this.selectedPainLocations
    };

    this.loading = true;
    this.http.post<any>('http://localhost:5000/api/nova/refine', answerPayload).subscribe({
      next: (data) => {
        this.state = data.state || {};
        this.askedQuestions = data.asked_questions || [];
        if (data.final_prediction) {
          this.response = {
            predicted_disease: data.final_prediction,
            confidence: data.confidence,
            disease_info: data.disease_info,
            bmi: data.bmi,
            painZonesExpanded: data.painZonesExpanded
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
    this.height = null;
    this.weight = null;
    this.sex = '';
    this.showPainQuestion = false;
    this.painAnswer = null;
    this.showBodySelection = false;
    this.selectedPainLocations = [];
  }
}
