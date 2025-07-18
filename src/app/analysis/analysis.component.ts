import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

import ChartDataLabels from 'chartjs-plugin-datalabels';
import annotationPlugin from 'chartjs-plugin-annotation';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

Chart.register(ChartDataLabels, annotationPlugin);

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
export class AnalysisComponent implements OnInit, AfterViewInit {
  symptoms: string[] = [];
  searchQuery: string = '';
  filteredSymptoms: string[] = [];
  selectedSymptoms: string[] = [];
  step: number = 1;
  showBmiModal = false;
  animatedConfidence = 0;
  animatedBmiPercent = 0;
  animatedBmi = 0;
  easedAnimatedConfidence = 0;
  animatedSeverity = 0;
  animatedContagious = 0;
  animatedCourse = 0;
  showDemographicsSection = false;
  showGenderChart = false;
  showAgeChart = false;


  activeTab: string = 'general';

  isDescriptionExpanded = false;
  textLimit = 200;

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


  constructor(private http: HttpClient) {
    Chart.register(...registerables);
  }

  get circleRadius(): number {
    const sizes = [4, 6.66, 9.33, 12];
    return sizes[this.circleSizeIndex - 1] || 4;
  }


  get hasDiseaseTreatment(): boolean {
    const treatment = this.response?.treatment?.disease_treatment;
    return !!treatment && Object.keys(treatment).length > 0;
  }


  get hasSymptomTreatments(): boolean {
    return !!this.response?.treatment?.symptom_treatments &&
      Object.keys(this.response.treatment.symptom_treatments).length > 0;
  }

  simulateFakeResponse(): void {
    this.age = 24;
    this.sex = 'Male';
    this.response =
    {
      "bmi": 24.69,
      "confidence": 0.3188423216342926,
      "disease_info": {
        "advice": "Seek medical attention if experiencing symptoms of hyperkalemia.Seek medical attention if experiencing symptoms of hyperkalemia. Seek medical attention if experiencing symptoms of hyperkalemia.",
        "chronic_or_acute": "Acute.",
        "complications": "Cardiac arrhythmias, muscle weakness, paralysis.",
        "contagious": "No.",
        "demographics": "Male: 20%, Female: 80%; 0\u20135 years: 0%, 5\u201310: 5%, 10\u201315: 10%, 15\u201320: 15%, 20\u201325: 20%, 30\u201335: 30%, 35\u201340: 25%, 40\u201345: 10%, 45\u201350: 5%, 55\u201360: %, 60\u201365: %, 65+ years: %.",
        "description": "Hyperkalemia is a medical condition characterized by high levels of potassium in the blood. It can be caused by kidney disease, certain medications, or conditions that affect potassium regulation in the body. Symptoms may include shortness of breath, depressive or psychotic symptoms, sharp chest pain, dizziness, difficulty in swallowing, feeling ill, vomiting, nausea, weakness, and decreased heart rate. Treatment may involve medications, dietary changes, or dialysis in severe cases.",
        "prevention": "Monitoring potassium levels regularly and following a balanced diet low in potassium.",
        "related_diseases": "Hypokalemia, electrolyte imbalance.",
        "risk_factor": "Kidney disease, certain medications (e.g., ACE inhibitors, potassium-sparing diuretics), conditions affecting potassium regulation.",
        "severity_level": "Severe."
      },
      "painZonesExpanded": [],
      "predicted_disease": "hyperkalemia",
      "treatment": {
        "disease_treatment": {
          "administration_route": "NaN",
          "alternative": "Communication aids",
          "dosage": "NaN",
          "driving_restrictions": "allowed",
          "frequency": "Regular sessions as advised by a therapist",
          "notes": "Early intervention can improve outcomes",
          "otc_medications": "NaN",
          "prescription_medications": "Speech therapy is the primary treatment",
          "recommended_duration": "Long-term, ongoing",
          "side_effects": "NaN",
          "treatment_type": "Symptomatic"
        },
        "symptom_treatments": {
          "difficulty_speaking": {
            "administration_route": "NaN",
            "alternative": "Communication aids",
            "dosage": "NaN",
            "driving_restrictions": "NaN",
            "frequency": "Regular sessions as advised by a therapist",
            "notes": "Early intervention can improve outcomes",
            "otc_medications": "NaN",
            "prescription_medications": "Speech therapy is the primary treatment",
            "recommended_duration": "Long-term, ongoing",
            "side_effects": "NaN",
            "treatment_type": "Symptomatic"
          },
          "feeling_ill": {
            "administration_route": "Oral",
            "alternative": "Rest, hydration",
            "dosage": "Paracetamol 500 mg, ibuprofen 200-400 mg",
            "driving_restrictions": "None",
            "frequency": "Every 4-6 hours as needed",
            "notes": "Ensure no contraindications with other medications.",
            "otc_medications": "Paracetamol, ibuprofen",
            "prescription_medications": "NaN",
            "recommended_duration": "As needed",
            "side_effects": "Nausea, dizziness",
            "treatment_type": "Symptomatic"
          },
          "palpitations": {
            "administration_route": "Oral",
            "alternative": "Lifestyle changes, stress management",
            "dosage": "Typically 25-100 mg per day",
            "driving_restrictions": "Caution if experiencing dizziness",
            "frequency": "Once or twice daily",
            "notes": "Palpitations should be assessed to rule out cardiac complications.",
            "otc_medications": "NaN",
            "prescription_medications": "Beta-blockers (e.g., Metoprolol)",
            "recommended_duration": "As prescribed",
            "side_effects": "Fatigue, dizziness, cold extremities",
            "treatment_type": "Symptomatic"
          },
          "shortness_of_breath": {
            "administration_route": "Inhalation (for bronchodilators)",
            "alternative": "Breathing exercises, oxygen therapy",
            "dosage": "As prescribed",
            "driving_restrictions": "NaN",
            "frequency": "As prescribed",
            "notes": "Shortness of breath related to AAA should be evaluated by a healthcare provider immediately.",
            "otc_medications": "NaN",
            "prescription_medications": "Bronchodilators (if related to respiratory issues)",
            "recommended_duration": "As prescribed by a healthcare provider",
            "side_effects": "Tremors, nervousness, headache",
            "treatment_type": "Symptomatic"
          }
        }
      }
    };

    this.loading = false;
    this.errorMessage = '';
    this.currentClarification = null;
    this.renderDemographicCharts();
  }


  ngOnInit(): void {
    this.loadSymptoms();
    this.loadSvgPaths();

    //this.simulateFakeResponse();

    // Anime la jauge si des données sont présentes
    setTimeout(() => {
      if (this.response?.confidence) {
        this.animateConfidence(this.response.confidence * 100);
      }
      if (this.response?.bmi) {
        this.animateBmiGauge(this.response.bmi);
      }
    }, 100);
    this.animateSeverity();
    this.animateContagiousGauge();
    this.animateCourseGauge();
    this.setInitialActiveTab();
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.response?.disease_info?.demographics) {
        this.renderDemographicCharts();
      }
    }, 0);
  }


  ngOnChanges(): void {
    if (this.response?.disease_info?.severity_level) {
      this.animateSeverity();
    }
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

  showBmiChart(): void {
    this.showBmiModal = true;
    setTimeout(() => {
      const canvas = document.getElementById('imcChart') as HTMLCanvasElement;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      new Chart(ctx, {
        type: 'line',
        data: {
          labels: [140, 150, 160, 170, 180, 190], // tailles en cm
          datasets: [
            {
              label: 'Poids normal',
              data: [40, 50, 60, 70, 80, 90],
              borderColor: 'rgba(34,197,94,0.6)', // vert
              backgroundColor: 'rgba(34,197,94,0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Surpoids',
              data: [50, 60, 70, 80, 90, 100],
              borderColor: 'rgba(234,179,8,0.6)', // jaune
              backgroundColor: 'rgba(234,179,8,0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Obésité',
              data: [60, 70, 80, 90, 100, 110],
              borderColor: 'rgba(239,68,68,0.6)', // rouge
              backgroundColor: 'rgba(239,68,68,0.1)',
              fill: true,
              tension: 0.4
            },
            {
              label: 'Votre poids',
              data: [null, null, this.weight],
              borderColor: '#ec4899',
              pointBackgroundColor: '#ec4899',
              pointRadius: 6,
              fill: false,
              borderWidth: 2,
              tension: 0,
              showLine: false
            }
          ]
        },
        options: {
          responsive: true,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Taille (cm)',
                color: '#ccc'
              },
              ticks: {
                color: '#ccc'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Poids (kg)',
                color: '#ccc'
              },
              ticks: {
                color: '#ccc'
              }
            }
          },
          plugins: {
            legend: {
              labels: {
                color: '#ccc'
              }
            }
          }
        }
      });
    }, 100);
  }


  bmiPercent(bmi: number): number {
    if (!bmi) return 0;
    const min = 15;
    const max = 35;
    const clamped = Math.max(min, Math.min(bmi, max));
    return Math.round(((clamped - min) / (max - min)) * 100);
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

  animateConfidence(target: number): void {
    this.animatedConfidence = 0;
    this.easedAnimatedConfidence = 0;

    const duration = 1000;
    const startTime = performance.now();

    const easeInOutQuad = (t: number): number =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (currentTime: number) => {
      const raw = Math.min((currentTime - startTime) / duration, 1);
      const eased = easeInOutQuad(raw);

      this.animatedConfidence = +(target * raw).toFixed(0);
      this.easedAnimatedConfidence = +(target * eased).toFixed(0);

      if (raw < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  animateBmiGauge(bmi: number): void {
    const quality = this.getBmiQualityPercent(bmi);
    this.animatedBmiPercent = 0;
    this.animatedBmi = 0;

    const duration = 1000;
    const startTime = performance.now();

    const easeInOutQuad = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (currentTime: number) => {
      const raw = Math.min((currentTime - startTime) / duration, 1);
      const progress = easeInOutQuad(raw);

      this.animatedBmiPercent = +(quality * progress).toFixed(0);
      this.animatedBmi = +(bmi * progress).toFixed(1);

      if (raw < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  getBmiQualityPercent(bmi: number): number {
    if (bmi < 16.5 || bmi > 40) return 10;       // très mauvais
    if (bmi < 18.5 || (bmi >= 30 && bmi < 35)) return 40; // insuffisance ou obésité modérée
    if ((bmi >= 25 && bmi < 30)) return 70;      // surpoids
    if (bmi >= 18.5 && bmi < 25) return 100;     // normal
    return 20; // fallback
  }

  getGradientColor(percent: number): string {
    const clamped = Math.max(0, Math.min(percent, 100));

    let r: number, g: number;
    const b = 90;

    if (clamped < 50) {

      r = 255;
      g = Math.round((clamped / 50) * 255);
    } else {

      r = Math.round(255 - ((clamped - 50) / 50) * 255);
      g = 255;
    }

    return `rgb(${r},${g},${b})`;
  }

  animateSeverity(): void {
    if (
      !this.response ||
      !this.response.disease_info ||
      !this.response.disease_info.severity_level
    ) {
      this.animatedSeverity = 0;
      return;
    }

    const target = this.mapSeverityToValue(this.response.disease_info.severity_level);
    this.animatedSeverity = 0;

    const duration = 1000;
    const startTime = performance.now();

    const easeInOutQuad = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (currentTime: number) => {
      const raw = Math.min((currentTime - startTime) / duration, 1);
      const progress = easeInOutQuad(raw);

      this.animatedSeverity = +(target * progress).toFixed(0);

      if (raw < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }


  mapSeverityToValue(severity: string): number {
    const s = severity.replace(/\./g, '').toLowerCase(); // nettoyage
    if (s.includes('severe')) return 100;
    if (s.includes('moderate') && s.includes('mild')) return 60;
    if (s.includes('moderate')) return 70;
    if (s.includes('mild')) return 30;
    return 50; // fallback
  }

  getSeverityColor(percent: number): string {
    const clamped = Math.max(0, Math.min(percent, 100));
    const b = 90;

    let r: number, g: number;

    if (clamped < 50) {
      // De vert vers jaune
      g = 255;
      r = Math.round((clamped / 50) * 255);
    } else {
      // De jaune vers rouge
      g = Math.round(255 - ((clamped - 50) / 50) * 255);
      r = 255;
    }

    return `rgb(${r},${g},${b})`;
  }

  animateContagiousGauge(): void {
    const target = 100;
    this.animatedContagious = 0;

    const duration = 1000;
    const startTime = performance.now();

    const easeInOutQuad = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (currentTime: number) => {
      const raw = Math.min((currentTime - startTime) / duration, 1);
      const progress = easeInOutQuad(raw);

      this.animatedContagious = +(target * progress).toFixed(0);

      if (raw < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  getContagiousColor(contagious: string): string {
    const clean = contagious?.trim().toLowerCase().replace('.', '');
    return clean === 'yes' ? 'rgb(255, 0, 90)' : 'rgb(0, 255, 90)';
  }


  animateCourseGauge(): void {
    const target = 100;
    this.animatedCourse = 0;

    const duration = 1000;
    const startTime = performance.now();

    const easeInOutQuad = (t: number) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    const step = (currentTime: number) => {
      const raw = Math.min((currentTime - startTime) / duration, 1);
      const progress = easeInOutQuad(raw);

      this.animatedCourse = +(target * progress).toFixed(0);

      if (raw < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }

  getCourseColor(course: string): string {
    const clean = course?.trim().toLowerCase().replace('.', '');
    return clean === 'chronic' ? 'rgb(255, 0, 90)' : 'rgb(0, 255, 90)';
  }

  formatDiseaseLabel(label: string): string {
    if (!label) return '';
    const formatted = label.replace(/_/g, ' ');
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  get descriptionShort(): string {
    const full = this.response?.disease_info?.description || '';
    return full.slice(0, this.textLimit);
  }

  get descriptionRemaining(): string {
    const full = this.response?.disease_info?.description || '';
    return full.length > this.textLimit ? full.slice(this.textLimit) : '';
  }

  getTreatmentKeys(treatmentObj: any): string[] {
    return Object.keys(treatmentObj || {});
  }

  getSymptomList(symptomTreatments: any): string[] {
    return Object.keys(symptomTreatments || {});
  }

  formatKeyLabel(key: string): string {
    return key.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  }

  parseDemographics(demographics: string): {
    genderData: { labels: string[], values: number[] },
    ageData: { labels: string[], values: number[] },
    isGenderDataValid: boolean,
    isAgeDataValid: boolean
  } {
    const clean = demographics.replace(/\\u2013/g, '-').replace(/\b(\w+):\s?%(?!\d)/g, '$1: 0%');

    const genderRegex = /(Male|Female):\s?(\d+)%/gi;
    const ageRegex = /(\d{1,2}\+?|\d{1,2}-\d{1,2})\s?(?:years)?:\s?(\d+)%/gi;

    const genderLabels: string[] = [];
    const genderValues: number[] = [];
    const ageLabels: string[] = [];
    const ageValues: number[] = [];

    let match;

    while ((match = genderRegex.exec(clean)) !== null) {
      genderLabels.push(match[1]);
      genderValues.push(parseInt(match[2], 10));
    }

    while ((match = ageRegex.exec(clean)) !== null) {
      ageLabels.push(match[1]);
      ageValues.push(parseInt(match[2], 10));
    }

    const isGenderDataValid = genderValues.some(v => v > 0);
    const isAgeDataValid = ageValues.some(v => v > 0);

    return {
      genderData: { labels: genderLabels, values: genderValues },
      ageData: { labels: ageLabels, values: ageValues },
      isGenderDataValid,
      isAgeDataValid
    };
  }

  getDemographicsGridClass(): string {
    if (this.showGenderChart && this.showAgeChart) return 'grid-cols-5';
    if (this.showGenderChart) return 'grid-cols-2';
    if (this.showAgeChart) return 'grid-cols-3';
    return '';
  }


  renderDemographicCharts(): void {
    const demographics = this.response?.disease_info?.demographics;
    this.showDemographicsSection = false;
    this.showGenderChart = false;
    this.showAgeChart = false;

    if (!demographics || !demographics.includes('Male') || !demographics.includes('Female')) {
      return;
    }

    const { genderData, ageData, isGenderDataValid, isAgeDataValid } = this.parseDemographics(demographics);

    if (!isGenderDataValid && !isAgeDataValid) {
      return;
    }

    this.showDemographicsSection = true;
    this.showGenderChart = isGenderDataValid;
    this.showAgeChart = isAgeDataValid;

    const genderCanvas = document.getElementById('genderChart') as HTMLCanvasElement | null;
    const ageCanvas = document.getElementById('ageChart') as HTMLCanvasElement | null;

    if (isGenderDataValid && genderCanvas) {
      let highlightIndexGender = -1;
      if (this.sex) {
        highlightIndexGender = genderData.labels.findIndex(label =>
          label.toLowerCase() === this.sex.toLowerCase()
        );
      }

      const highlightBorderColorGender = 'yellow';
      const highlightBorderWidthGender = 2;

      new Chart(genderCanvas, {
        type: 'pie',
        data: {
          labels: genderData.labels,
          datasets: [{
            data: genderData.values,
            backgroundColor: ['rgb(185, 85, 247)', 'rgb(247, 85, 239)'],
            borderColor: genderData.values.map((_, i) =>
              i === highlightIndexGender ? highlightBorderColorGender : 'transparent'
            ),
            borderWidth: genderData.values.map((_, i) =>
              i === highlightIndexGender ? highlightBorderWidthGender : 0
            ),
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            datalabels: {
              color: 'white',
              font: { weight: 'bold', size: 12 },
              align: 'center',
              formatter: (value: number, context) => {
                const label = context.chart.data.labels?.[context.dataIndex];
                return value > 0 ? `${label}\n${value}%` : '';
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed; // La valeur correspond au pourcentage
                  return `${value}% of total cases`;
                }
              }
            }

          },
          layout: { padding: 0 },
          elements: {
            arc: {
              spacing: 0.35
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }



    /** ✅ AGE BAR CHART */
    if (isAgeDataValid && ageCanvas) {
      const customAgeLabels = [
        '0-5', '6-10', '11-15', '16-20', '21-25', '26-30',
        '31-35', '36-40', '41-45', '46-50', '51-55',
        '56-60', '61-65', '65+'
      ];

      let highlightIndex = -1;
      if (this.age !== null) {
        const userAge = this.age;
        for (let i = 0; i < customAgeLabels.length; i++) {
          const label = customAgeLabels[i];
          if (label.includes('+')) {
            const min = parseInt(label);
            if (userAge >= min) {
              highlightIndex = i;
            }
          } else {
            const [min, max] = label.split('-').map(n => parseInt(n));
            if (userAge >= min && userAge <= max) {
              highlightIndex = i;
              break;
            }
          }
        }
      }

      const highlightBorderColor = 'yellow';
      const highlightBorderWidth = 2;

      new Chart(ageCanvas, {
        type: 'bar',
        data: {
          labels: customAgeLabels,
          datasets: [{
            label: 'Age Distribution (%)',
            data: ageData.values,
            backgroundColor: 'rgb(185, 85, 247)',
            borderColor: ageData.values.map((_, i) =>
              i === highlightIndex ? highlightBorderColor : 'transparent'
            ),
            borderWidth: ageData.values.map((_, i) =>
              i === highlightIndex ? highlightBorderWidth : 0
            ),
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              title: {
                display: true,
                text: 'Age Groups',
                color: 'white',
                font: { size: 12, weight: 'bold' }
              },
              ticks: { color: 'white' }
            },
            y: {
              title: {
                display: true,
                text: 'Percentage (%)',
                color: 'white',
                font: { size: 12, weight: 'bold' }
              },
              ticks: { color: 'white' },
              beginAtZero: true,
              suggestedMax: Math.max(...ageData.values) + 5
            }
          },
          plugins: {
            legend: { display: false },
            datalabels: {
              color: 'white',
              anchor: 'end',
              align: 'top',
              font: { weight: 'bold' },
              formatter: (value: number) => value > 0 ? value + '%' : ''
            },
            tooltip: {
              callbacks: {
                label: (context) => `${context.parsed.y}% of total cases`
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }

  }



  splitTreatmentKeys(keys: string[]): [string[], string[]] {
    const mid = Math.ceil(keys.length / 2);
    return [keys.slice(0, mid), keys.slice(mid)];
  }


  setInitialActiveTab(): void {
    const hasGeneral = !!this.response?.treatment?.disease_treatment &&
      Object.keys(this.response.treatment.disease_treatment).length > 0;

    const symptoms = this.getSymptomList(this.response?.treatment?.symptom_treatments);

    if (hasGeneral) {
      this.activeTab = 'general';
    } else if (symptoms.length > 0) {
      this.activeTab = symptoms[0];
    } else {
      this.activeTab = '';
    }
  }

  downloadResultPDF(): void {
    const doc = new jsPDF();
    const today = new Date().toLocaleDateString();

    /** ✅ Informations patient */
    //const patientName = this.response?.patient_name || 'Not assigned';
    const patientAge = this.age ? `${this.age} years` : 'Not assigned';
    const patientGender = this.sex || 'Not assigned';

    /** ✅ Diagnostic principal */
    const disease = this.response?.predicted_disease
      ? this.formatDiseaseLabel(this.response.predicted_disease)
      : 'Unknown';
    const confidence = this.response?.confidence
      ? `${(this.response.confidence * 100).toFixed(2)}%`
      : 'Unknown';
    const description = this.response?.disease_info?.description || 'Not available';
    const advice = this.response?.disease_info?.advice || 'No advice provided';

    /** ✅ Indicateurs cliniques */
    const severity = this.response?.disease_info?.severity_level || 'Unknown';
    const contagious = this.response?.disease_info?.contagious || 'Unknown';
    const course = this.response?.disease_info?.chronic_or_acute || 'Unknown';

    /** ✅ HEADER avec Nova branding */
    doc.setFillColor(44, 62, 80);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Nova Health Assistant', 15, 20);
    doc.setFontSize(11);
    doc.text(`Medical Analysis Report - ${today}`, 200, 20, { align: 'right' });

    /** ✅ Patient Info */
    doc.setTextColor(0);
    doc.setFontSize(14);
    doc.text('Patient Information', 15, 45);
    doc.setFontSize(11);
    //doc.text(`Name: ${patientName}`, 15, 55);
    doc.text(`Age: ${patientAge}`, 15, 63);
    doc.text(`Gender: ${patientGender}`, 15, 71);

    /** ✅ Diagnostic principal */
    doc.setFontSize(14);
    doc.text('Diagnostic Result', 15, 85);
    doc.setFontSize(11);
    doc.text(`Disease: ${disease}`, 15, 95);
    doc.text(`Confidence: ${confidence}`, 15, 103);

    /** ✅ Indicateurs cliniques */
    doc.setFontSize(14);
    doc.text('Clinical Indicators', 15, 118);
    doc.setFontSize(11);
    doc.text(`Severity: ${severity}`, 15, 128);
    doc.text(`Contagious: ${contagious}`, 15, 136);
    doc.text(`Course: ${course}`, 15, 144);

    /** ✅ Description */
    doc.setFontSize(14);
    doc.text('Disease Description', 15, 160);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(description, 180), 15, 168);

    /** ✅ Recommended Actions */
    doc.setFontSize(14);
    doc.text('Recommended Actions', 15, 190);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(advice, 180), 15, 198);

    /** ✅ Traitement général */
    const treatment = this.response?.treatment?.disease_treatment || {};
    autoTable(doc, {
      startY: 220,
      head: [['General Treatment Details', 'Value']],
      body: [
        ['OTC Medications', treatment.otc_medications || 'Not available'],
        ['Prescription', treatment.prescription_medications || 'Not available'],
        ['Alternative', treatment.alternative || 'Not available'],
        ['Type', treatment.treatment_type || 'Not available'],
        ['Dosage', treatment.dosage || 'Not available'],
        ['Frequency', treatment.frequency || 'Not available'],
        ['Duration', treatment.recommended_duration || 'Not available'],
        ['Route', treatment.administration_route || 'Not available'],
        ['Notes', treatment.notes || 'Not available'],
      ],
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      bodyStyles: { textColor: 50 },
    });

    /** ✅ Traitements spécifiques par symptôme */
    /** ✅ Traitements spécifiques par symptôme (enchaînés dans le PDF) */
    if (this.response?.treatment?.symptom_treatments) {
      const symptoms = Object.keys(this.response.treatment.symptom_treatments || {});
      let currentY = (doc as any).lastAutoTable?.finalY || 240; // Démarrage sous le tableau précédent

      symptoms.forEach((symptom) => {
        const sympData = this.response?.treatment?.symptom_treatments?.[symptom] || {};

        // ✅ Titre du bloc
        doc.setFontSize(13);
        doc.setTextColor(44, 62, 80);
        doc.text(`Symptom Treatment: ${this.formatSymptom(symptom)}`, 15, currentY + 10);

        // ✅ Tableau
        autoTable(doc, {
          startY: currentY + 15,
          head: [['Detail', 'Value']],
          body: [
            ['OTC Medications', sympData.otc_medications || 'Not available'],
            ['Prescription', sympData.prescription_medications || 'Not available'],
            ['Alternative', sympData.alternative || 'Not available'],
            ['Type', sympData.treatment_type || 'Not available'],
            ['Dosage', sympData.dosage || 'Not available'],
            ['Frequency', sympData.frequency || 'Not available'],
            ['Duration', sympData.recommended_duration || 'Not available'],
            ['Route', sympData.administration_route || 'Not available'],
            ['Notes', sympData.notes || 'Not available'],
          ],
          theme: 'striped',
          margin: { left: 15, right: 15 },
          headStyles: { fillColor: [52, 152, 219], textColor: 255, fontSize: 11 },
          bodyStyles: { textColor: 50, fontSize: 10 },
        });

        // ✅ Mise à jour pour le prochain bloc
        currentY = (doc as any).lastAutoTable.finalY;
      });
    }


    /** ✅ Footer */
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated by Nova AI Health Assistant`, 105, pageHeight - 10, { align: 'center' });

    /** ✅ Téléchargement */
    doc.save(`Nova_Analysis_${today}.pdf`);
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
        if (data.final_prediction || data.predicted_disease) {
          this.response = data;
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
