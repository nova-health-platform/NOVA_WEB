import { Component, OnInit, AfterViewInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';

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

  simulateFakeResponse(): void {
    this.response = {
      predicted_disease: 'amyotrophic_lateral_sclerosis_als',
      confidence: 0.70,
      bmi: 20,
      painZonesExpanded: ['chest_front', 'abdomen_front'],
      disease_info: {
        description: "Amyotrophic lateral sclerosis (ALS), also known as Lou Gehrig's disease, is a progressive neurodegenerative disease that affects nerve cells in the brain and spinal cord. It leads to muscle weakness, disability, and eventually death. The disease is characterized by the degeneration of motor neurons, which are responsible for controlling voluntary muscle movements. As these neurons die, the brain loses the ability to initiate and control muscle movement, leading to symptoms such as difficulty speaking, swallowing, and breathing.",
        risk_factor: 'Age, chronic diseases, weak immune system.',
        prevention: 'Vaccination, hand hygiene, avoiding contact with sick people.',
        advice: 'Seek support from healthcare professionals and support groups to help manage symptoms and cope with the disease.',
        severity_level: 'Mild.',
        contagious: 'No.',
        chronic_or_acute: 'Acute.',
        related_diseases: 'Multiple sclerosis, Parkinson’s disease, Huntington’s disease.',
        complications: 'Respiratory failure, aspiration pneumonia, malnutrition.',
        demographics: 'Male: 80%, Female: 20%; 0–5 years: 0%, 5–10: 0%, 10–15: 1%, 15–20: 2%, 20–25: 5%, 30–35: 10%, 35–40: 15%, 40–45: 20%, 45–50: 20%, 55–60: 15%, 60–65: 10%, 65+ years: 2%.'
      },
      treatment: {
        disease_treatment: {
          otc_medications: 'Paracetamol, Ibuprofen',
          prescription_medications: 'Riluzole',
          recommended_duration: 'As prescribed',
          dosage: '50mg twice a day',
          frequency: 'Every 12 hours',
          administration_route: 'Oral',
          side_effects: 'Dizziness, nausea',
          alternative: 'Physiotherapy, respiratory support',
          treatment_type: 'Neuroprotective',
          driving_restrictions: 'Avoid driving if symptoms worsen',
          notes: 'Regular follow-ups recommended'
        },
        symptom_treatments: {
          difficulty_speaking: {
            otc_medications: 'Voice therapy exercises',
            prescription_medications: 'Baclofen',
            recommended_duration: '8 weeks',
            dosage: '10mg/day',
            frequency: 'Once daily',
            administration_route: 'Oral',
            side_effects: 'Fatigue, dry mouth',
            alternative: 'Speech therapy',
            treatment_type: 'Muscle relaxant',
            driving_restrictions: 'Use caution',
            notes: 'Monitor swallowing ability'
          },
          leg_cramps: {
            otc_medications: 'Magnesium supplements',
            prescription_medications: 'Quinine sulfate',
            recommended_duration: '2 weeks',
            dosage: '200mg/day',
            frequency: 'Once a day',
            administration_route: 'Oral',
            side_effects: 'Ringing in ears, nausea',
            alternative: 'Stretching, hydration',
            treatment_type: 'Antispasmodic',
            driving_restrictions: 'Avoid if dizzy',
            notes: 'Discontinue if side effects occur'
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

    // Simule une réponse directement au chargement
    this.simulateFakeResponse();

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
    ageData: { labels: string[], values: number[] }
  } {
    const genderRegex = /(Male|Female):\s?(\d+)%/gi;
    const ageRegex = /(\d{1,2}\+?\s?(?:years)?|\d{1,2}–\d{1,2}):\s?(\d+)%/gi;

    const genderLabels: string[] = [];
    const genderValues: number[] = [];
    const ageLabels: string[] = [];
    const ageValues: number[] = [];

    let match;

    while ((match = genderRegex.exec(demographics)) !== null) {
      genderLabels.push(match[1]);
      genderValues.push(parseInt(match[2], 10));
    }

    while ((match = ageRegex.exec(demographics)) !== null) {
      ageLabels.push(match[1].replace('years', '').trim());
      ageValues.push(parseInt(match[2], 10));
    }

    return {
      genderData: { labels: genderLabels, values: genderValues },
      ageData: { labels: ageLabels, values: ageValues }
    };
  }

  renderDemographicCharts(): void {
    const demographics = this.response?.disease_info?.demographics;
    if (!demographics) return;

    const { genderData, ageData } = this.parseDemographics(demographics);

    const genderCanvas = document.getElementById('genderChart') as HTMLCanvasElement | null;
    const ageCanvas = document.getElementById('ageChart') as HTMLCanvasElement | null;

    if (!genderCanvas || !ageCanvas) return;

    new Chart(genderCanvas, {
      type: 'pie',
      data: {
        labels: genderData.labels,
        datasets: [{
          data: genderData.values,
          backgroundColor: ['rgb(139, 92, 246)', 'rgb(217, 70, 239)'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { color: 'white' } }
        }
      }
    });

    new Chart(ageCanvas, {
      type: 'bar',
      data: {
        labels: ageData.labels,
        datasets: [{
          label: 'Age Distribution (%)',
          data: ageData.values,
          backgroundColor: 'rgb(139, 92, 246)',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: 'white' } },
          y: { ticks: { color: 'white' }, beginAtZero: true }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
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
