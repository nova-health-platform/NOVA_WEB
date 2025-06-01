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

interface SelectionCircle {
  cx: number;
  cy: number;
  r: number;
  matchedPaths: string[];
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
  svgPathsBack: SvgPath[] = [];
  showPainQuestion: boolean = false;
  painAnswer: boolean | null = null;
  showBodySelection: boolean = false;
  selectedPainLocations: string[] = [];

  selectionCircles: SelectionCircle[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.loadSymptoms();
    this.loadSvgPaths();

    this.showBodySelection = true;
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
      error: (err) => console.error('Error loading front SVG paths:', err)
    });
    this.http.get<SvgPath[]>('assets/pain_location_back.json').subscribe({
      next: (data) => this.svgPathsBack = data,
      error: (err) => console.error('Error loading back SVG paths:', err)
    });
  }

  handleSvgClick(event: MouseEvent, side: 'front' | 'back'): void {
    const svg = (event.target as SVGElement).closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    const cx = ((event.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
    const cy = ((event.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;

    const r = 4;
    const paths = side === 'front' ? this.svgPaths : this.svgPathsBack;
    const matched: string[] = [];

    const circle = new DOMPoint(cx, cy);
    const radius = r;

    for (const path of paths) {
      if (path.id === 'body') continue;

      const pathEl = document.getElementById(path.id);
      if (!pathEl) continue;

      const geometry = pathEl as unknown as SVGGeometryElement;

      const bbox = geometry.getBBox();
      const step = 0.5;

      let overlaps = false;
      for (let x = bbox.x; x <= bbox.x + bbox.width; x += step) {
        for (let y = bbox.y; y <= bbox.y + bbox.height; y += step) {
          const dx = x - cx;
          const dy = y - cy;
          if (dx * dx + dy * dy <= radius * radius) {
            const point = new DOMPoint(x, y);
            if (geometry.isPointInFill?.(point)) {
              overlaps = true;
              break;
            }
          }
        }
        if (overlaps) break;
      }

      if (overlaps) {
        matched.push(path.id);
      }
    }

    const existingIndex = this.selectionCircles.findIndex(
      (c) => Math.abs(c.cx - cx) < r && Math.abs(c.cy - cy) < r
    );

    if (existingIndex >= 0) {
      const circle = this.selectionCircles[existingIndex];
      this.selectionCircles.splice(existingIndex, 1);
      this.selectedPainLocations = this.selectedPainLocations.filter(
        id => !circle.matchedPaths.includes(id)
      );
    } else {
      this.selectionCircles.push({ cx, cy, r, matchedPaths: matched });
      matched.forEach(id => {
        if (!this.selectedPainLocations.includes(id)) {
          this.selectedPainLocations.push(id);
        }
      });
    }
  }

  resetBodySelection(): void {
    this.selectedPainLocations = [];
    this.selectionCircles = [];
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
    this.selectionCircles = [];
  }
}
