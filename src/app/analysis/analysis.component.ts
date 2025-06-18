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
  step: number = 1;

  response: {
    predicted_disease: string;
    confidence: number;
    disease_info: any;
    treatment: any;
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

  svgFrontPaths: SvgPath[] = [];
  svgBackPaths: SvgPath[] = [];
  showPainQuestion: boolean = false;
  painAnswer: boolean | null = null;
  showBodySelection: boolean = false;
  selectedPainLocations: string[] = [];

  selectionCirclesFront: SelectionCircle[] = [];
  selectionCirclesBack: SelectionCircle[] = [];

  circleSizeIndex: number = 1;
  hoverCircleFront: { cx: number; cy: number; r: number } | null = null;
  hoverCircleBack: { cx: number; cy: number; r: number } | null = null;


  constructor(private http: HttpClient) { }

  get circleRadius(): number {
    const sizes = [4, 6.66, 9.33, 12];
    return sizes[this.circleSizeIndex - 1] || 4;
  }

  simulateFakeResponse(): void {
    this.response = {
      predicted_disease: 'Influenza (Flu)',
      confidence: 92.5,
      bmi: 24.7,
      painZonesExpanded: ['chest_front', 'abdomen_front'],
      disease_info: {
        description: 'The flu is a common viral infection that can be deadly for high-risk groups.',
        risk_factor: 'Age, chronic diseases, weak immune system.',
        prevention: 'Vaccination, hand hygiene, avoiding contact with sick people.',
        advice: 'Rest, stay hydrated, take antiviral medications if prescribed.',
        severity_level: 'Moderate',
        contagious: 'Yes',
        chronic_or_acute: 'Acute'
      },
      treatment: {
        otc_medications: 'Paracetamol, Ibuprofen',
        prescription_medications: 'Oseltamivir',
        recommended_duration: '5 days',
        dosage: '500mg twice a day',
        frequency: 'Every 12 hours',
        administration_route: 'Oral',
        side_effects: 'Nausea, headache',
        alternative: 'Hydration, rest',
        treatment_type: 'Antiviral',
        driving_restrictions: 'No driving if drowsy',
        notes: 'Consult a physician if symptoms persist'
      }
    };
    this.loading = false;
    this.errorMessage = '';
    this.currentClarification = null;
  }

  ngOnInit(): void {
    this.loadSymptoms();
    this.loadSvgPaths();

    // uniquement pour le dev temporaire
    this.simulateFakeResponse();

  }

  loadSymptoms(): void {
    this.http.get<string[]>('http://localhost:5000/api/symptoms').subscribe({
      next: (data) => this.symptoms = data,
      error: (err) => console.error('Error loading symptoms:', err)
    });
  }

  loadSvgPaths(): void {
    this.http.get<SvgPath[]>('assets/pain_location_front.json').subscribe({
      next: (data) => this.svgFrontPaths = data,
      error: (err) => console.error('Error loading front SVG paths:', err)
    });
    this.http.get<SvgPath[]>('assets/pain_location_back.json').subscribe({
      next: (data) => this.svgBackPaths = data,
      error: (err) => console.error('Error loading back SVG paths:', err)
    });
  }

  formatSymptom(symptom: string): string {
    if (!symptom) return '';
    const formatted = symptom.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  treatmentKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  formatKey(key: string): string {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  handleSvgHover(event: MouseEvent, side: 'front' | 'back'): void {
    const svg = (event.target as SVGElement).closest('svg');
    if (!svg) {
      if (side === 'front') this.hoverCircleFront = null;
      if (side === 'back') this.hoverCircleBack = null;
      return;
    }

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    const cx = ((event.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
    const cy = ((event.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;

    const bodyPath = svg.querySelector('#body') as SVGGeometryElement;
    if (!bodyPath || !bodyPath.isPointInFill?.(new DOMPoint(cx, cy))) {
      if (side === 'front') this.hoverCircleFront = null;
      if (side === 'back') this.hoverCircleBack = null;
      return;
    }

    const hover = { cx, cy, r: this.circleRadius };
    if (side === 'front') this.hoverCircleFront = hover;
    if (side === 'back') this.hoverCircleBack = hover;
  }


  handleSvgClick(event: MouseEvent, side: 'front' | 'back'): void {
    const svg = (event.target as SVGElement).closest('svg');
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    const cx = ((event.clientX - rect.left) / rect.width) * viewBox.width + viewBox.x;
    const cy = ((event.clientY - rect.top) / rect.height) * viewBox.height + viewBox.y;

    const bodyPath = svg.querySelector('#body') as SVGGeometryElement;
    if (!bodyPath || !bodyPath.isPointInFill?.(new DOMPoint(cx, cy))) {
      return;
    }

    const r = this.circleRadius;
    const paths = side === 'front' ? this.svgFrontPaths : this.svgBackPaths;
    const matched: string[] = [];

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
          if (dx * dx + dy * dy <= r * r) {
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

    const targetArray = side === 'front' ? this.selectionCirclesFront : this.selectionCirclesBack;

    const existingIndex = targetArray.findIndex(
      (c) => Math.hypot(c.cx - cx, c.cy - cy) < 10
    );

    if (existingIndex >= 0) {
      const circle = targetArray[existingIndex];
      targetArray.splice(existingIndex, 1);
      this.selectedPainLocations = this.selectedPainLocations.filter(
        id => !circle.matchedPaths.includes(id)
      );
    } else {
      targetArray.push({ cx, cy, r, matchedPaths: matched });
      matched.forEach(id => {
        if (!this.selectedPainLocations.includes(id)) {
          this.selectedPainLocations.push(id);
        }
      });
    }
  }

  resetBodySelection(): void {
    this.selectedPainLocations = [];
    this.selectionCirclesFront = [];
    this.selectionCirclesBack = [];
  }

  filterSymptoms(): void {
    const query = this.searchQuery.toLowerCase().replace(/ /g, '_');
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
    this.errorMessage = '';
    this.step = 2;
  }

  submitPatientInfo(): void {
    if (!this.age || !this.sex || !this.weight || !this.height) {
      this.errorMessage = 'Please enter your age, gender, weight and height.';
      return;
    }
    this.errorMessage = '';
    this.step = 3;
  }

  answerPainQuestion(answer: boolean): void {
    this.painAnswer = answer;
    if (answer) {
      this.showBodySelection = true;
      this.step = 4; // On passe à l'étape suivante
    } else {
      this.step = 4; // On passe aussi à l'étape suivante pour soumettre
      this.submitSymptomsToApi();
    }
  }

  previousStep(): void {
    if (this.step > 1) {
      this.step -= 1;
      this.errorMessage = '';
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
            treatment: data.treatment,
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
    this.selectionCirclesFront = [];
    this.selectionCirclesBack = [];
    this.hoverCircleFront = null;
    this.hoverCircleBack = null;
    this.step = 1;
  }
}
