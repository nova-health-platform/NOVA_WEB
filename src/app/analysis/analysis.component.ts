import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
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

interface AnimatedMessage {
  role: 'user' | 'assistant';
  type: 'text' | 'clarification' | 'pain' | 'bodySelection' | 'result' | 'resultSwitcher' | 'demographics' | 'treatments' | 'extras' | 'quickSummary';
  content: string;
  answered?: boolean;
  isAnimating?: boolean;
  displayedText?: string;
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
  // Chat message model
  messages: AnimatedMessage[] = [];

  currentResultView: 'result' | 'demographics' | 'treatments' = 'result';
  thinking = false;
  showDiseaseInfo = false;
  showRecommendedActions = false;
  showConfidenceModal = false;
  currentDate = new Date().toLocaleDateString();
  
  // Typewriter animation properties
  typewriterSpeed = 3; // milliseconds per character (base speed)
  typewriterAnimation: any = null;
  isSimulatedResponse = false; // Flag to detect simulated responses

  @ViewChild('chatScrollContainer') chatScrollContainer?: ElementRef<HTMLDivElement>;
  @ViewChild('scrollAnchor') scrollAnchor?: ElementRef<HTMLDivElement>;
  symptoms: string[] = [];
  searchQuery: string = '';
  filteredSymptoms: string[] = [];
  selectedSymptoms: string[] = [];
  selectedSources: { [canonical: string]: 'suggested' | 'free' } = {};
  // Free-text extraction flow
  freeTextSymptoms: string = '';
  showExtractionConfirm: boolean = false;
  extractedRecognized: { canonical: string; label: string; synonyms: string[]; selected: boolean }[] = [];
  extractedUnrecognized: string[] = [];
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
  
  // Flag pour éviter les appels multiples simultanés
  private isRenderingCharts = false;

  // Demographic data for Quick Summary
  genderData: { labels: string[], values: number[] } = { labels: [], values: [] };
  ageData: { labels: string[], values: number[] } = { labels: [], values: [] };

  // Modal properties
  showDescriptionModal = false;
  currentModalDescription = '';

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

  // User authentication and profiles
  isLoggedIn: boolean = false;
  userProfiles: any[] = [];
  selectedProfile: any = null;
  loadingProfiles: boolean = false;
  currentUser: any = null;
  canCreateProfile: boolean = false;
  canPerformAnalysis: boolean = false;
  lastAnalysisTime: Date | null = null;
  premiumAnalysesWithoutProfile: number = 0; // Counter for Premium users without profile
  showManualEntry: boolean = false;
  timeUntilNextAnalysis: string = '';
  timeUntilNextAnalysisSeconds: number = 0;
  countdownInterval: any = null;
  isTimerLoading: boolean = true;
  isPageLoading: boolean = true;

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

  // Synonyms and fuzzy matching maps
  synonymsMap: { [canonical: string]: string[] } = {};
  synonymToCanonical: { [normalizedSynonym: string]: string } = {};


  constructor(private http: HttpClient, private authService: AuthService, private router: Router) {
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
    this.isSimulatedResponse = true; // Enable instant typing for simulated responses
    this.age = 24;
    this.sex = 'Male';
    this.response =
    {
      "bmi": 24.69,
      "confidence": 0.92,
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
            "notes": "Early intervention can improve outcomes",
            "otc_medications": "NaN",
            "prescription_medications": "Speech therapy is the primary treatment",
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
    
    // Add Quick Summary message first
    const quickSummaryContent = this.generateQuickSummaryContent();
    this.addAnimatedMessage({
      role: 'assistant',
      type: 'quickSummary',
      content: quickSummaryContent,
      isAnimating: true,
      displayedText: ''
    });
    
    // Note: Detailed analysis will be shown only when user clicks the button in Quick Summary
    
    // Trigger animations and render charts
    setTimeout(() => {
      if (this.response?.confidence) {
        this.animateConfidence(this.response.confidence * 100);
      }
      this.animateSeverity();
      this.animateContagiousGauge();
      this.animateCourseGauge();
      // Render demographic charts if data is available
      if (this.response?.disease_info?.demographics) {
        setTimeout(() => {
          this.renderDemographicCharts();
        }, 100);
      }
    }, 50);
    
    // Auto-show detailed analysis in development mode
    setTimeout(() => {
      this.showDetailedAnalysis();
    }, 2000); // Wait 2 seconds for Quick Summary animation to complete
  }


  ngOnInit(): void {
    this.loadSymptoms();
    this.loadSynonyms();
    this.loadSvgPaths();
    this.loadLastAnalysisTime();
    
    // Check auth status after a delay to ensure everything is loaded
    setTimeout(() => {
      this.checkAuthStatus();
      // Hide page loading after auth check
      setTimeout(() => {
        this.isPageLoading = false;
      }, 1000); // Additional delay to ensure smooth transition
    }, 500);

    this.simulateFakeResponse();
    this.setInitialActiveTab();

    // Start countdown timer for real-time updates
    this.startCountdownTimer();
  }


  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.response?.disease_info?.demographics) {
        this.renderDemographicCharts();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    // Clean up countdown timer
    this.stopCountdownTimer();
  }

  private preloadProfileImage(): void {
    const img = new Image();
    img.onload = () => {
      // Image is loaded, now show the first message
      this.pushAssistantImmediateTextAnimated("Hello, describe your symptoms. Add several items and send.");
    };
    img.onerror = () => {
      // If image fails to load, show message anyway after a short delay
      setTimeout(() => {
        this.pushAssistantImmediateTextAnimated("Hello, describe your symptoms. Add several items and send.");
      }, 500);
    };
    img.src = 'assets/profile.png';
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

  loadSynonyms(): void {
    this.http.get<Array<{ symptom: string; synonyms: string[] }>>('http://localhost:5000/api/symptoms/synonyms').subscribe({
      next: (records) => {
        this.synonymsMap = {};
        this.synonymToCanonical = {};
        for (const rec of records || []) {
          const canonical = this.normalize(rec.symptom);
          const syns = Array.isArray(rec.synonyms) ? rec.synonyms : [];
          const normalizedSyns = [rec.symptom, ...syns]
            .filter(Boolean)
            .map(s => this.normalize(s));
          this.synonymsMap[canonical] = Array.from(new Set(normalizedSyns));
          for (const s of normalizedSyns) {
            this.synonymToCanonical[s] = canonical;
          }
        }
      },
      error: (err) => console.error('Error loading synonyms:', err)
    });
  }

  private normalize(input: string): string {
    return (input || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9\s_\-]/g, ' ')
      .replace(/[\s\-]+/g, ' ')
      .trim()
      .replace(/ /g, '_');
  }

  private levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = new Array(n + 1).fill(0);
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
      let prev = i - 1;
      dp[0] = i;
      for (let j = 1; j <= n; j++) {
        const temp = dp[j];
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[j] = Math.min(
          dp[j] + 1,
          dp[j - 1] + 1,
          prev + cost
        );
        prev = temp;
      }
    }
    return dp[n];
  }

  private bestFuzzyCanonical(queryRaw: string): { canonical: string; distance: number } | null {
    const query = this.normalize(queryRaw);
    if (!query) return null;

    // Exact or synonym match first
    if (this.synonymToCanonical[query]) {
      return { canonical: this.synonymToCanonical[query], distance: 0 };
    }

    // Fallback to fuzzy search across known synonyms
    let bestCanonical: string | null = null;
    let bestDistance = Infinity;
    const maxDistance = Math.max(1, Math.round(Math.min(3, query.length * 0.25)));

    for (const [canonical, syns] of Object.entries(this.synonymsMap)) {
      for (const s of syns) {
        const d = this.levenshtein(query, s);
        if (d < bestDistance) {
          bestDistance = d;
          bestCanonical = canonical;
          if (bestDistance === 0) break;
        }
      }
      if (bestDistance === 0) break;
    }

    if (bestCanonical !== null && bestDistance <= maxDistance) {
      return { canonical: bestCanonical, distance: bestDistance };
    }
    return null;
  }

  private mapToCanonical(input: string): string {
    const best = this.bestFuzzyCanonical(input);
    if (best) return best.canonical;
    return this.normalize(input);
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
    const raw = this.searchQuery;
    const query = this.normalize(raw);
    if (!query) {
      this.filteredSymptoms = [];
      return;
    }

    // Collect candidates from canonical list by partial match
    const canonicalCandidates = new Set<string>();
    for (const canonical of this.symptoms) {
      const norm = this.normalize(canonical);
      if (norm.includes(query)) canonicalCandidates.add(norm);
    }

    // Include synonym-based candidates by partial match
    for (const [canonical, syns] of Object.entries(this.synonymsMap)) {
      if (canonical.includes(query)) canonicalCandidates.add(canonical);
      for (const s of syns) {
        if (s.includes(query)) canonicalCandidates.add(canonical);
      }
    }

    // If no partial matches, use fuzzy across synonyms
    if (canonicalCandidates.size === 0) {
      const scored: Array<{ canonical: string; score: number }> = [];
      const seen = new Set<string>();
      for (const [canonical, syns] of Object.entries(this.synonymsMap)) {
        for (const s of syns) {
          const d = this.levenshtein(query, s);
          const max = Math.max(s.length, query.length);
          const score = 1 - d / Math.max(1, max);
          if (!seen.has(canonical) || score > (scored.find(x => x.canonical === canonical)?.score || -1)) {
            seen.add(canonical);
            const idx = scored.findIndex(x => x.canonical === canonical);
            if (idx >= 0) scored[idx].score = score; else scored.push({ canonical, score });
          }
        }
      }
      scored.sort((a, b) => b.score - a.score);
      this.filteredSymptoms = scored.filter(s => s.score >= 0.5).slice(0, 10).map(s => s.canonical);
      return;
    }

    this.filteredSymptoms = Array.from(canonicalCandidates).slice(0, 10);
  }

  addSymptom(symptom?: string): void {
    const input = (symptom || this.searchQuery).trim();
    if (!input) return;

    // Always accept free text, map to canonical for ML
    const canonical = this.mapToCanonical(input);
    if (!this.selectedSymptoms.includes(canonical)) {
      this.selectedSymptoms.push(canonical);
      this.selectedSources[canonical] = symptom ? 'suggested' : 'free';
    }
    this.searchQuery = '';
    this.filteredSymptoms = [];
  }

  removeSymptom(index: number): void {
    const removed = this.selectedSymptoms.splice(index, 1)[0];
    if (removed) {
      delete this.selectedSources[removed];
    }
  }

  formatSymptoms(symptoms: string[]): string[] {
    // Ensure all selected are mapped to canonical for API
    return symptoms.map(s => this.mapToCanonical(s));
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
              label: 'Obesity',
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
    // Deprecated in free-text flow. Route to extract.
    this.extractSymptomsFromFreeText();
  }

  extractSymptomsFromFreeText(): void {
    const text = (this.freeTextSymptoms || this.searchQuery || '').trim();
    if (!text) {
      this.errorMessage = 'Please describe your symptoms.';
      return;
    }
    this.errorMessage = '';
    // Show user's raw text as a message
    this.messages.push({ role: 'user', type: 'text', content: text });
    this.scrollToBottomSoon();

    this.loading = true;
    this.http.post<any>('http://localhost:5000/api/symptoms/extract', { text }).subscribe({
      next: (res) => {
        const recognized = Array.isArray(res?.recognized) ? res.recognized : [];
        const unrecognized = Array.isArray(res?.unrecognized) ? res.unrecognized : [];
        this.extractedRecognized = recognized.map((r: any) => ({
          canonical: r.canonical,
          label: r.label || this.formatSymptom(r.canonical),
          synonyms: r.synonyms || [],
          selected: true
        }));
        this.extractedUnrecognized = unrecognized;
        this.showExtractionConfirm = true;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.error || 'Failed to extract symptoms. Please try again.';
        this.loading = false;
      }
    });
  }

  toggleRecognizedSelection(index: number): void {
    const item = this.extractedRecognized[index];
    if (item) item.selected = !item.selected;
  }

  backToEditFreeText(): void {
    this.showExtractionConfirm = false;
  }

  confirmRecognizedSelection(): void {
    const chosen = this.extractedRecognized.filter(i => i.selected);
    if (chosen.length === 0) {
      this.errorMessage = 'Please validate at least one recognized symptom or go back to edit.';
      return;
    }
    this.errorMessage = '';
    this.selectedSymptoms = chosen.map(i => i.canonical);
    this.selectedSources = {};
    for (const i of chosen) this.selectedSources[i.canonical] = 'suggested';
    // Proceed to demographics step
    this.step = 2;
    this.pushAssistantImmediateTextAnimated('Thanks. Enter your info: age, gender, weight, height.');
    this.scrollToBottomSoon();
  }

  submitPatientInfo(): void {
    // Check if user can perform analysis
    if (this.isLoggedIn && !this.canPerformAnalysis) {
      return; // Don't proceed if analysis is not allowed
    }

    // Check Premium plan limitations
    if (this.isLoggedIn && this.currentUser?.subscription_plan === 'premium' && !this.selectedProfile) {
      if (this.premiumAnalysesWithoutProfile >= 5) {
        this.errorMessage = 'You have reached the limit of 5 analyses without a profile. Please create or select a profile for unlimited analyses.';
        return;
      }
    }

    // Check if we have patient information (either from profile or manual entry)
    if (!this.age || !this.sex || !this.weight || !this.height) {
      this.errorMessage = 'Please select a profile or enter patient information.';
      return;
    }
    this.errorMessage = '';

    // Record analysis time for free plan users
    if (this.isLoggedIn && this.currentUser?.subscription_plan === 'free') {
      this.lastAnalysisTime = new Date();
      localStorage.setItem('lastAnalysisTime', this.lastAnalysisTime.toISOString());
    }

    // Record analysis count for Premium users without profile
    if (this.isLoggedIn && this.currentUser?.subscription_plan === 'premium' && !this.selectedProfile) {
      this.premiumAnalysesWithoutProfile++;
      this.savePremiumAnalysisCount();
    }

    // Add patient info to messages
    const patientInfo = this.selectedProfile 
      ? `Profile: ${this.selectedProfile.first_name} ${this.selectedProfile.last_name} (Age: ${this.age}, Gender: ${this.sex}, Weight: ${this.weight}kg, Height: ${this.height}cm)`
      : `Age: ${this.age}, Gender: ${this.sex}, Weight: ${this.weight}kg, Height: ${this.height}cm`;
    
    this.messages.push({ role: 'user', type: 'text', content: patientInfo });
    this.step = 3;
    // brief thinking animation before pain question (bottom typing indicator)
    this.showThinking(1000);
    setTimeout(() => {
      this.pushAssistantPainAnimated('Are you experiencing physical pain?');
    }, 1000);
  }

  answerPainQuestion(answer: boolean): void {
    this.painAnswer = answer;
    
    // Add user's response to the chat
    this.messages.push({ role: 'user', type: 'text', content: answer ? 'Yes' : 'No' });
    this.scrollToBottomSoon();
    
    // Mark the pain question as answered (hide buttons)
    this.markLastYesNoMessageAnswered('pain');
    
    if (answer) {
      this.showBodySelection = true;
      this.step = 4;
      this.showThinking(1000);
      setTimeout(() => {
        this.pushAssistantBodySelectionAnimated('Indicate your pain locations on the body.');
      }, 1000);
    } else {
      this.step = 4;
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
    this.markLastMessageAnswered('bodySelection');
    this.showThinking(1000);

    setTimeout(() => {
      // 👉 on affiche d'abord le message utilisateur
      this.messages.push({ role: 'user', type: 'text', content: 'Areas have been selected.' });
      this.scrollToBottomSoon();

      // 👉 then only, we mark the pain question as answered
      this.markLastYesNoMessageAnswered('pain');

      // 👉 and we send the API call AFTER
      this.submitSymptomsToApi();
    }, 1000);
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
    if (bmi < 16.5 || bmi > 40) return 10;       // very bad
    if (bmi < 18.5 || (bmi >= 30 && bmi < 35)) return 40; // underweight or moderate obesity
    if ((bmi >= 25 && bmi < 30)) return 70;      // overweight
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
    return clean === 'chronic' ? '#ef4444' : '#22c55e'; // red-500 for chronic, green-500 for acute
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
    // Clean the string: replace Unicode dashes with regular dashes and handle empty percentages
    const clean = demographics
      .replace(/\\u2013/g, '-')  // Replace Unicode dashes
      .replace(/\u2013/g, '-')   // Replace actual Unicode dashes in the string
      .replace(/\b(\w+):\s?%(?!\d)/g, '$1: 0%'); // Handle empty percentages like "55–60: %"

    const genderRegex = /(Male|Female):\s?(\d+)%/gi;
    
    // Updated regex to handle the specific format:
    // "0–5 years: 0%", "5–10: 5%", "20–25: 20%", "65+ years: %"
    const ageRegex = /(\d{1,2}(?:[–-]\d{1,2})?\+?)\s?(?:years)?:\s?(\d*)%/gi;

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
      // Handle empty percentages by defaulting to 0
      const percentage = match[2] === '' ? '0' : match[2];
      ageValues.push(parseInt(percentage, 10));
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



  getPersonalizedDemographicContext(): string {
    if (!this.age || !this.sex) return '';
    
    const userAgeGroup = this.findUserAgeGroup(this.age);
    if (!userAgeGroup) return '';
    
    const total = this.ageData.values.reduce((sum, val) => sum + val, 0);
    const userAgeGroupIndex = this.ageData.labels.findIndex(label => label === userAgeGroup);
    const userPercent = userAgeGroupIndex !== -1 ? Math.round((this.ageData.values[userAgeGroupIndex] / total) * 100) : 0;
    
    // Determine risk level based on percentage
    let riskLevel = 'low';
    if (userPercent >= 25) riskLevel = 'high';
    else if (userPercent >= 15) riskLevel = 'moderate';
    
    const genderText = this.sex.toLowerCase() === 'male' ? 'male' : 'female';
    const ageText = this.age;
    
    return `As a ${ageText}-year-old ${genderText}, you fall into a ${riskLevel} risk demographic for this condition.`;
  }

  getPersonalizedGenderContext(): string {
    if (!this.sex) return '';
    
    const genderText = this.sex.toLowerCase() === 'male' ? 'male' : 'female';
    const ageText = this.age ? `${this.age}-year-old ` : '';
    
    return `As a ${ageText}${genderText}, this information is particularly relevant to your demographic profile.`;
  }

  getPersonalizedAgeContext(): string {
    if (!this.age) return '';
    
    const userAgeGroup = this.findUserAgeGroup(this.age);
    if (!userAgeGroup) return '';
    
    const total = this.ageData.values.reduce((sum, val) => sum + val, 0);
    const userAgeGroupIndex = this.ageData.labels.findIndex(label => label === userAgeGroup);
    const userPercent = userAgeGroupIndex !== -1 ? Math.round((this.ageData.values[userAgeGroupIndex] / total) * 100) : 0;
    
    // Determine risk level based on percentage
    let riskLevel = 'low';
    if (userPercent >= 25) riskLevel = 'high';
    else if (userPercent >= 15) riskLevel = 'moderate';
    
    return `As a ${this.age}-year-old, you fall into a ${riskLevel} risk age group for this condition.`;
  }

  getPersonalizedTreatmentAdvice(): string {
    if (!this.age || !this.sex) return '';
    
    const userAgeGroup = this.findUserAgeGroup(this.age);
    if (!userAgeGroup) return '';
    
    const total = this.ageData.values.reduce((sum, val) => sum + val, 0);
    const userAgeGroupIndex = this.ageData.labels.findIndex(label => label === userAgeGroup);
    const userPercent = userAgeGroupIndex !== -1 ? Math.round((this.ageData.values[userAgeGroupIndex] / total) * 100) : 0;
    
    // Determine advice based on risk level and age
    if (userPercent >= 25) {
      return 'Given your high-risk demographic profile, immediate medical consultation is strongly recommended.';
    } else if (userPercent >= 15) {
      return 'Given your moderate risk demographic, early intervention is particularly important for optimal outcomes.';
    } else if (this.age < 30) {
      return 'Given your age profile, early detection and treatment can significantly improve long-term outcomes.';
    } else {
      return 'Given your demographic profile, regular monitoring and adherence to treatment recommendations are essential.';
    }
  }

  generateQuickSummaryContent(): string {
    if (!this.response) return '';
    
    // Parse demographics data if available to ensure variables are set
    // ✅ NE PAS modifier les flags ici - laisser renderDemographicCharts() s'en occuper
    if (this.response?.disease_info?.demographics) {
      const demographics = this.parseDemographics(this.response.disease_info.demographics);
      this.genderData = demographics.genderData;
      this.ageData = demographics.ageData;
      // ✅ Supprimé : this.showDemographicsSection = true;
      // ✅ Supprimé : this.showGenderChart = demographics.isGenderDataValid;
      // ✅ Supprimé : this.showAgeChart = demographics.isAgeDataValid;
    }
    
    const confidenceValue = this.response.confidence ? Math.round(this.response.confidence * 100) : 0;
    const diseaseName = this.formatDiseaseName(this.response.predicted_disease);
    let content = `Based on your symptoms, the most likely condition is <strong>${diseaseName}</strong> with a <strong>${confidenceValue}% confidence</strong>.`;
    
    // Add severity and contagious info only if available
    const severity = this.getFormattedSeverity();
    const contagious = this.getFormattedContagious();
    if (severity && severity !== 'Unknown' && contagious && contagious !== 'Unknown') {
      content += `<br><br>This condition typically has <strong>${severity} severity</strong> and is <strong>${contagious}</strong>.`;
    }
    
    // Add demographics only if we have valid data
    // ✅ Vérifier directement les données au lieu des flags
    if (this.response?.disease_info?.demographics && this.genderData.labels.length > 0) {
      const genderText = this.getGenderDistributionText();
      const ageText = this.getAgeDistributionText();
      
      // Only add demographics section if we have at least one valid piece of data
      if (genderText || ageText) {
        content += '<br><br>';
        
        if (genderText && ageText) {
          content += `This condition affects <strong>${genderText}</strong> and is <strong>${ageText}</strong>.`;
          const demographicContext = this.getPersonalizedDemographicContext();
          if (demographicContext) {
            content += ` ${demographicContext}`;
          }
        } else if (genderText && !ageText) {
          content += `This condition affects <strong>${genderText}</strong>.`;
          const genderContext = this.getPersonalizedGenderContext();
          if (genderContext) {
            content += ` ${genderContext}`;
          }
        } else if (!genderText && ageText) {
          content += `This condition is <strong>${ageText}</strong>.`;
          const ageContext = this.getPersonalizedAgeContext();
          if (ageContext) {
            content += ` ${ageContext}`;
          }
        }
      }
    }
    
    // Add treatment only if we have valid treatment data
    if (this.hasDiseaseTreatment) {
      const treatmentType = this.response?.treatment?.disease_treatment?.treatment_type;
      const duration = this.response?.treatment?.disease_treatment?.recommended_duration;
      const prescription = this.response?.treatment?.disease_treatment?.prescription_medications;
      const otc = this.response?.treatment?.disease_treatment?.otc_medications;
      
      // Check if we have any valid treatment data
      const hasValidTreatmentType = treatmentType && treatmentType.toLowerCase() !== 'n/a' && treatmentType.trim();
      const hasValidDuration = duration && duration.toLowerCase() !== 'n/a' && duration.trim();
      const hasValidPrescription = prescription && prescription !== 'NaN' && prescription.trim() && prescription.toLowerCase() !== 'n/a';
      const hasValidOtc = otc && otc !== 'NaN' && otc.trim() && otc.toLowerCase() !== 'n/a';
      
      if (hasValidTreatmentType || hasValidDuration || hasValidPrescription || hasValidOtc) {
        let treatmentText = '<br><br>';
        
        // Build treatment description based on available data
        if (hasValidTreatmentType) {
          const formattedTreatmentType = this.formatTreatmentType(treatmentType);
          treatmentText += `The recommended approach is <strong>${formattedTreatmentType}</strong>`;
          
          if (hasValidDuration) {
            const formattedDuration = this.formatDuration(duration);
            treatmentText += ` with a <strong>${formattedDuration}</strong> treatment duration`;
          }
          treatmentText += '.';
        } else if (hasValidDuration) {
          const formattedDuration = this.formatDuration(duration);
          treatmentText += `The recommended treatment duration is <strong>${formattedDuration}</strong>.`;
        }
        
        // Add medications
        if (hasValidPrescription) {
          const formattedPrescription = this.formatMedication(prescription);
          if (hasValidTreatmentType || hasValidDuration) {
            treatmentText += ` <strong>${formattedPrescription}</strong>`;
          } else {
            treatmentText += `The primary treatment is <strong>${formattedPrescription}</strong>.`;
          }
        }
        
        if (hasValidOtc) {
          const formattedOtc = this.formatMedication(otc);
          if (hasValidTreatmentType || hasValidDuration || hasValidPrescription) {
            treatmentText += ` Additionally, ${formattedOtc} may be considered.`;
          } else {
            treatmentText += `${formattedOtc} may be considered as treatment.`;
          }
        }
        
        // Ensure proper punctuation at the end
        if (treatmentText && !treatmentText.endsWith('.') && !treatmentText.endsWith('!') && !treatmentText.endsWith('?')) {
          treatmentText += '.';
        }
        
        // Add personalized advice only if we have treatment data
        const treatmentAdvice = this.getPersonalizedTreatmentAdvice();
        if (treatmentAdvice) {
          treatmentText += ` ${treatmentAdvice}`;
        }
        
        content += treatmentText;
      }
    }
    
    return content;
  }

  private formatAgeGroup(ageGroup: string): string {
    // If it's just a number, add "years"
    if (/^\d+$/.test(ageGroup.trim())) {
      return `${ageGroup} years`;
    }
    // If it already contains "years", return as is
    if (ageGroup.toLowerCase().includes('years')) {
      return ageGroup;
    }
    // For ranges like "20-30", add "years"
    if (ageGroup.includes('-')) {
      return `${ageGroup} years`;
    }
    // For ranges like "65+", add "years"
    if (ageGroup.includes('+')) {
      return `${ageGroup} years`;
    }
    // Default: return as is
    return ageGroup;
  }

  private formatTreatmentType(treatmentType: string): string {
    if (!treatmentType) return '';
    
    // Convert to lowercase and capitalize first letter
    const formatted = treatmentType.toLowerCase().trim();
    
    // Handle common treatment types
    const treatmentMap: { [key: string]: string } = {
      'symptomatic': 'symptomatic',
      'symptomatic treatment': 'symptomatic treatment',
      'supportive': 'supportive',
      'supportive care': 'supportive care',
      'conservative': 'conservative',
      'conservative treatment': 'conservative treatment',
      'medical': 'medical',
      'medical treatment': 'medical treatment',
      'surgical': 'surgical',
      'surgical treatment': 'surgical treatment',
      'pharmacological': 'pharmacological',
      'pharmacological treatment': 'pharmacological treatment',
      'n/a': 'not specified'
    };
    
    return treatmentMap[formatted] || formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private formatDuration(duration: string): string {
    if (!duration) return '';
    
    const formatted = duration.toLowerCase().trim();
    
    // Handle common duration formats
    const durationMap: { [key: string]: string } = {
      'long-term': 'long-term',
      'long-term, ongoing': 'long-term, ongoing',
      'long term': 'long-term',
      'long term ongoing': 'long-term, ongoing',
      'short-term': 'short-term',
      'short term': 'short-term',
      'acute': 'acute',
      'chronic': 'chronic',
      'ongoing': 'ongoing',
      'continuous': 'continuous',
      'intermittent': 'intermittent',
      'as needed based on medical advice': 'as needed',
      'as prescribed': 'as prescribed',
      'n/a': 'not specified'
    };
    
    return durationMap[formatted] || formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  private formatMedication(medication: string): string {
    if (!medication) return '';
    
    const formatted = medication.trim();
    
    // Handle N/A cases
    if (formatted.toLowerCase() === 'n/a') {
      return 'not specified';
    }
    
    // If it already ends with proper punctuation, return as is
    if (formatted.endsWith('.') || formatted.endsWith('!') || formatted.endsWith('?')) {
      return formatted;
    }
    
    // If it starts with a capital letter and looks like a sentence, return as is
    if (/^[A-Z]/.test(formatted) && formatted.length > 10) {
      return formatted;
    }
    
    // Handle complex medication descriptions
    if (formatted.includes(',') || formatted.includes('(') || formatted.includes(')')) {
      return formatted;
    }
    
    // If it's a simple medication name, capitalize first letter
    if (formatted.length < 50 && !formatted.includes('.')) {
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    
    // Default: return as is
    return formatted;
  }

  private formatDiseaseName(diseaseName: string): string {
    if (!diseaseName) return '';
    
    // Handle disease names with underscores (e.g., "abdominal_aortic_aneurysm")
    if (diseaseName.includes('_')) {
      return diseaseName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    // If already properly formatted, ensure proper capitalization
    return diseaseName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private getGenderDistributionText(): string {
    if (!this.genderData.labels.length || !this.genderData.values.length) return '';
    
    const total = this.genderData.values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return '';
    
    const maleIndex = this.genderData.labels.findIndex(label => label.toLowerCase() === 'male');
    const femaleIndex = this.genderData.labels.findIndex(label => label.toLowerCase() === 'female');
    
    let result = '';
    if (maleIndex !== -1 && this.genderData.values[maleIndex] > 0) {
      const malePercent = Math.round((this.genderData.values[maleIndex] / total) * 100);
      result += `${malePercent}% male`;
    }
    if (femaleIndex !== -1 && this.genderData.values[femaleIndex] > 0) {
      const femalePercent = Math.round((this.genderData.values[femaleIndex] / total) * 100);
      if (result) result += ', ';
      result += `${femalePercent}% female`;
    }
    
    return result;
  }

  private getAgeDistributionText(): string {
    if (!this.ageData.labels.length || !this.ageData.values.length) return '';
    
    const total = this.ageData.values.reduce((sum, val) => sum + val, 0);
    if (total === 0) return '';
    
    const maxIndex = this.ageData.values.indexOf(Math.max(...this.ageData.values));
    const maxAgeGroup = this.ageData.labels[maxIndex];
    const maxPercent = Math.round((this.ageData.values[maxIndex] / total) * 100);
    const formattedMaxAgeGroup = this.formatAgeGroup(maxAgeGroup);
    
    let result = `most common in ${formattedMaxAgeGroup} (${maxPercent}%)`;
    
    if (this.age !== null && this.age !== undefined) {
      const userAgeGroup = this.findUserAgeGroup(this.age);
      if (userAgeGroup) {
        const userAgeGroupIndex = this.ageData.labels.findIndex(label => label === userAgeGroup);
        if (userAgeGroupIndex !== -1 && this.ageData.values[userAgeGroupIndex] > 0) {
          const userPercent = Math.round((this.ageData.values[userAgeGroupIndex] / total) * 100);
          const formattedUserAgeGroup = this.formatAgeGroup(userAgeGroup);
          result += `, and you fall into the ${formattedUserAgeGroup} group (${userPercent}%)`;
        }
      }
    }
    
    return result;
  }

  private findUserAgeGroup(userAge: number): string | null {
    if (!this.ageData.labels.length) return null;
    
    for (const ageGroup of this.ageData.labels) {
      const isInGroup = this.isAgeInGroup(userAge, ageGroup);
      if (isInGroup) {
        return ageGroup;
      }
    }
    return null;
  }

  private isAgeInGroup(age: number, ageGroup: string): boolean {
    // Handle different age group formats
    if (ageGroup.includes('-')) {
      // Format: "20-30" or "20-30 years"
      const match = ageGroup.match(/(\d+)-(\d+)/);
      if (match) {
        const minAge = parseInt(match[1]);
        const maxAge = parseInt(match[2]);
        return age >= minAge && age <= maxAge;
      }
    } else if (ageGroup.includes('+')) {
      // Format: "65+" or "65+ years"
      const match = ageGroup.match(/(\d+)\+/);
      if (match) {
        const minAge = parseInt(match[1]);
        return age >= minAge;
      }
    } else {
      // Single age format: "25" or "25 years"
      const match = ageGroup.match(/(\d+)/);
      if (match) {
        const exactAge = parseInt(match[1]);
        return age === exactAge;
      }
    }
    return false;
  }


  renderDemographicCharts(): void {
    console.log('🔍 renderDemographicCharts() called');
    console.log('📊 Current flags:', {
      showDemographicsSection: this.showDemographicsSection,
      showGenderChart: this.showGenderChart,
      showAgeChart: this.showAgeChart,
      isRenderingCharts: this.isRenderingCharts
    });
    
    // ✅ Protection contre les appels multiples simultanés
    if (this.isRenderingCharts) {
      console.log('⚠️ Charts already rendering, skipping...');
      return;
    }
    
    // ✅ Protection supplémentaire : vérifier que response existe
    if (!this.response) {
      console.log('❌ No response data available for charts');
      return;
    }
    
    this.isRenderingCharts = true;
    const demographics = this.response?.disease_info?.demographics;
    console.log('📈 Demographics data:', demographics);

    if (!demographics || !demographics.includes('Male') || !demographics.includes('Female')) {
      // ✅ Seulement maintenant on peut réinitialiser si pas de données
      console.log('❌ No valid demographics data found, hiding charts');
      this.showDemographicsSection = false;
      this.showGenderChart = false;
      this.showAgeChart = false;
      this.isRenderingCharts = false; // ✅ Libérer le flag
      return;
    }

    const { genderData, ageData, isGenderDataValid, isAgeDataValid } = this.parseDemographics(demographics);

    if (!isGenderDataValid && !isAgeDataValid) {
      // ✅ Seulement maintenant on peut réinitialiser si données invalides
      console.log('❌ Invalid gender/age data, hiding charts');
      this.showDemographicsSection = false;
      this.showGenderChart = false;
      this.showAgeChart = false;
      this.isRenderingCharts = false; // ✅ Libérer le flag
      return;
    }

    // Store demographic data for Quick Summary
    this.genderData = genderData;
    this.ageData = ageData;

    // ✅ Mettre à jour les flags seulement si tout est valide
    console.log('✅ Setting flags:', {
      showDemographicsSection: true,
      showGenderChart: isGenderDataValid,
      showAgeChart: isAgeDataValid
    });
    this.showDemographicsSection = true;
    this.showGenderChart = isGenderDataValid;
    this.showAgeChart = isAgeDataValid;

    // Add a delay to ensure DOM elements are rendered
    setTimeout(() => {
      const genderCanvas = document.getElementById('genderChart') as HTMLCanvasElement | null;
      const ageCanvas = document.getElementById('ageChart') as HTMLCanvasElement | null;

    if (isGenderDataValid && genderCanvas) {
      console.log('🎯 Creating gender chart with canvas:', genderCanvas);
      let highlightIndexGender = -1;
      if (this.sex) {
        highlightIndexGender = genderData.labels.findIndex(label =>
          label.toLowerCase() === this.sex.toLowerCase()
        );
      }

      // Variables supprimées car maintenant définies directement dans le map

      new Chart(genderCanvas, {
        type: 'pie',
        data: {
          labels: genderData.labels,
          datasets: [{
            data: genderData.values,
            backgroundColor: genderData.values.map((_, i) =>
              i === highlightIndexGender ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)' // Vert normal pour l'utilisateur, vert sombre pour les autres
            ),
            borderColor: genderData.values.map((_, i) =>
              'transparent' // Pas de bordure
            ),
            borderWidth: genderData.values.map((_, i) =>
              0 // Pas de bordure
            ),
            hoverOffset: 6,
            spacing: 0.5, // Espace réduit entre les sections
            offset: genderData.values.map((_, i) => 
              i === highlightIndexGender ? 12 : 0 // La section de l'utilisateur se détache de 12px du centre
            )
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            datalabels: {
              color: (context) => {
                // Texte blanc et en gras pour la section de l'utilisateur, grisé pour les autres
                return context.dataIndex === highlightIndexGender ? 'white' : 'rgba(255, 255, 255, 0.6)';
              },
              font: (context) => {
                // Gras pour la section de l'utilisateur, normal pour les autres
                return {
                  weight: context.dataIndex === highlightIndexGender ? 'bold' : 'normal',
                  size: 14
                };
              },
              align: 'center',
              formatter: (value: number, context) => {
                const label = context.chart.data.labels?.[context.dataIndex];
                return value > 0 ? `${label}\n${value}%` : '';
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1,
              callbacks: {
                label: (context) => {
                  const value = context.parsed;
                  return `${value}% of total cases`;
                }
              }
            }
          },
          layout: { padding: 10 },
          elements: {
            arc: {
              spacing: 0.2
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }



    /** ✅ AGE BAR CHART */
    if (isAgeDataValid && ageCanvas) {
      console.log('📊 Creating age chart with canvas:', ageCanvas);
      const allAgeLabels = [
        '0-5', '6-10', '11-15', '16-20', '21-25', '26-30',
        '31-35', '36-40', '41-45', '46-50', '51-55',
        '56-60', '61-65', '65+'
      ];

      // Filtrer les labels et données pour enlever les plages avec 0%
      const filteredData = [];
      const filteredLabels = [];
      const originalToFilteredIndex = [];
      
      for (let i = 0; i < ageData.values.length; i++) {
        if (ageData.values[i] > 0) {
          filteredData.push(ageData.values[i]);
          filteredLabels.push(allAgeLabels[i]);
          originalToFilteredIndex[i] = filteredData.length - 1;
        } else {
          originalToFilteredIndex[i] = -1; // Marquer comme supprimé
        }
      }

      let highlightIndex = -1;
      if (this.age !== null) {
        const userAge = this.age;
        for (let i = 0; i < allAgeLabels.length; i++) {
          const label = allAgeLabels[i];
          if (ageData.values[i] > 0) { // Seulement si cette plage a des données
            if (label.includes('+')) {
              const min = parseInt(label);
              if (userAge >= min) {
                highlightIndex = originalToFilteredIndex[i];
              }
            } else {
              const [min, max] = label.split('-').map(n => parseInt(n));
              if (userAge >= min && userAge <= max) {
                highlightIndex = originalToFilteredIndex[i];
                break;
              }
            }
          }
        }
      }

      // Variables supprimées car maintenant définies directement dans le map

      new Chart(ageCanvas, {
        type: 'bar',
        data: {
          labels: filteredLabels,
          datasets: [{
            label: 'Age Distribution (%)',
            data: filteredData,
            backgroundColor: filteredData.map((_, i) =>
              i === highlightIndex ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)' // Vert normal pour l'utilisateur, vert sombre pour les autres
            ),
            borderColor: filteredData.map((_, i) =>
              'transparent' // Pas de bordure
            ),
            borderWidth: filteredData.map((_, i) =>
              0 // Pas de bordure
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
                color: 'rgba(255, 255, 255, 0.6)', // Grisé
                font: { size: 13, weight: 'bold' }
              },
              ticks: { 
                color: 'rgba(255, 255, 255, 0.6)', // Grisé
                font: { size: 11 }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Percentage (%)',
                color: 'rgba(255, 255, 255, 0.6)', // Grisé
                font: { size: 13, weight: 'bold' }
              },
              ticks: { 
                color: 'rgba(255, 255, 255, 0.6)', // Grisé
                font: { size: 11 }
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              beginAtZero: true,
              suggestedMax: Math.max(...filteredData) + 5
            }
          },
          plugins: {
            legend: { display: false },
            datalabels: {
              color: (context) => {
                // Blanc pour la section de l'utilisateur, grisé pour les autres
                return context.dataIndex === highlightIndex ? 'white' : 'rgba(255, 255, 255, 0.6)';
              },
              anchor: 'end',
              align: 'top',
              font: (context) => {
                // Gras et plus gros pour la section de l'utilisateur, normal pour les autres
                return {
                  weight: context.dataIndex === highlightIndex ? 'bold' : 'normal',
                  size: context.dataIndex === highlightIndex ? 14 : 11
                };
              },
              formatter: (value: number) => value > 0 ? value + '%' : ''
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: 'white',
              bodyColor: 'white',
              borderColor: 'rgb(34, 197, 94)',
              borderWidth: 1,
              callbacks: {
                label: (context) => `${context.parsed.y}% of total cases`
              }
            }
          }
        },
        plugins: [ChartDataLabels]
      });
    }

    }, 100); // End of setTimeout
    
    // ✅ Libérer le flag après un délai pour permettre le rendu
    setTimeout(() => {
      this.isRenderingCharts = false;
    }, 200);
  }

  // Function to switch to demographics tab and render charts
  switchToDemographicsTab(): void {
    this.currentResultView = 'demographics';
    setTimeout(() => {
      this.checkCanvasState(); // ✅ Vérifier l'état avant le rendu
      this.renderDemographicCharts();
    }, 50);
  }

  // ✅ Méthode pour forcer le rendu des graphiques
  private forceRenderCharts(): void {
    if (this.response?.disease_info?.demographics) {
      // Réinitialiser le flag de rendu pour forcer un nouveau rendu
      this.isRenderingCharts = false;
      setTimeout(() => {
        this.renderDemographicCharts();
      }, 100);
    }
  }

  // ✅ Méthode pour vérifier l'état des canvas
  private checkCanvasState(): void {
    const genderCanvas = document.getElementById('genderChart') as HTMLCanvasElement | null;
    const ageCanvas = document.getElementById('ageChart') as HTMLCanvasElement | null;
    
    console.log('🔍 Canvas state check:', {
      genderCanvas: genderCanvas ? 'Found' : 'Missing',
      ageCanvas: ageCanvas ? 'Found' : 'Missing',
      showGenderChart: this.showGenderChart,
      showAgeChart: this.showAgeChart,
      currentResultView: this.currentResultView
    });
  }

  // ✅ Méthode publique pour forcer le rendu (utile pour le débogage)
  public forceRenderDemographicCharts(): void {
    console.log('🚀 Force rendering demographic charts');
    this.checkCanvasState();
    this.forceRenderCharts();
  }

  // Function to switch to analysis tab and animate confidence
  switchToAnalysisTab(): void {
    this.currentResultView = 'result';
    // Reset confidence to 0 and animate to target value
    this.animatedConfidence = 0;
    setTimeout(() => {
      if (this.response?.confidence) {
        this.animateConfidence(this.response.confidence * 100);
      }
    }, 50);
  }

  toggleDiseaseInfo(): void {
    this.showDiseaseInfo = !this.showDiseaseInfo;
  }

  toggleRecommendedActions(): void {
    this.showRecommendedActions = !this.showRecommendedActions;
  }

  getFormattedSeverity(): string {
    if (!this.response?.disease_info?.severity_level) return '';
    const severity = this.response.disease_info.severity_level.replace('.', '').toLowerCase();
    return severity;
  }

  getFormattedContagious(): string {
    if (!this.response?.disease_info?.contagious) return '';
    const contagious = this.response.disease_info.contagious.replace('.', '').toLowerCase();
    return contagious === 'no' ? 'not contagious' : 'contagious';
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
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Colors palette - Modern and professional
    const colors = {
      primary: [34, 197, 94] as [number, number, number],      // green-500
      primaryDark: [22, 163, 74] as [number, number, number],  // green-600
      primaryLight: [134, 239, 172] as [number, number, number], // green-300
      secondary: [16, 16, 16] as [number, number, number],     // #101010
      accent: [59, 130, 246] as [number, number, number],      // blue-500
      accentLight: [147, 197, 253] as [number, number, number], // blue-300
      text: [31, 41, 55] as [number, number, number],          // gray-800
      textLight: [107, 114, 128] as [number, number, number],  // gray-500
      background: [248, 250, 252] as [number, number, number], // gray-50
      backgroundLight: [241, 245, 249] as [number, number, number], // slate-100
      white: [255, 255, 255] as [number, number, number],
      border: [226, 232, 240] as [number, number, number]      // slate-200
    };

    /** ✅ Modern Header with gradient effect */
    // Background
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    // Logo area with subtle pattern
    doc.setFillColor(colors.primaryDark[0], colors.primaryDark[1], colors.primaryDark[2]);
    doc.rect(0, 0, 60, 40, 'F');
    
    // Main title
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('NOVA', 15, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Health Assistant', 15, 28);
    
    // Report info
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Medical Analysis Report', pageWidth - 15, 18, { align: 'right' });
    doc.text(today, pageWidth - 15, 28, { align: 'right' });

    /** ✅ Patient Information Card */
    let currentY = 55;
    this.addCardHeader(doc, 'Patient Information', currentY, colors);
    currentY += 12;
    
    const patientAge = this.age ? `${this.age} years` : 'Not specified';
    const patientGender = this.sex || 'Not specified';
    
    // Patient info in a clean layout
    doc.setFontSize(11);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(`Age: ${patientAge}`, 20, currentY);
    doc.text(`Gender: ${patientGender}`, 20, currentY + 8);

    /** ✅ Diagnostic Result Card */
    currentY += 20;
    this.addCardHeader(doc, 'Diagnostic Result', currentY, colors);
    currentY += 12;
    
    const disease = this.response?.predicted_disease
      ? this.formatDiseaseLabel(this.response.predicted_disease)
      : 'Unknown';
    const confidence = this.response?.confidence
      ? `${(this.response.confidence * 100).toFixed(1)}%`
      : 'Unknown';
    
    // Disease name with confidence badge
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(disease, 20, currentY);
    
    // Confidence indicator with better structure
    const confidenceText = confidence.toString();
    const labelText = 'CONFIDENCE';
    const labelWidth = doc.getTextWidth(labelText);
    const confidenceWidth = Math.max(doc.getTextWidth(confidenceText), labelWidth) + 20;
    const confidenceHeight = 16;
    const badgeX = pageWidth - confidenceWidth - 20;
    const badgeY = currentY - 10;
    
    // Badge background
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.roundedRect(badgeX, badgeY, confidenceWidth, confidenceHeight, 8, 8, 'F');
    
    // Badge border
    doc.setDrawColor(colors.accentLight[0], colors.accentLight[1], colors.accentLight[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(badgeX, badgeY, confidenceWidth, confidenceHeight, 8, 8, 'S');
    
    // Label at the top
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.text(labelText, badgeX + confidenceWidth/2, badgeY + 5, { align: 'center' });
    
    // Confidence percentage at the bottom
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.text(confidenceText, badgeX + confidenceWidth/2, badgeY + 12, { align: 'center' });

    /** ✅ Clinical Indicators */
    currentY += 20;
    this.addCardHeader(doc, 'Clinical Indicators', currentY, colors);
    currentY += 12;
    
    const severity = this.response?.disease_info?.severity_level || 'Unknown';
    const contagious = this.response?.disease_info?.contagious || 'Unknown';
    const course = this.response?.disease_info?.chronic_or_acute || 'Unknown';
    
    // Indicators in modern card layout
    const indicators = [
      { label: 'Severity', value: severity, color: this.getSeverityColorRGB(severity), icon: '⚠️' },
      { label: 'Contagious', value: contagious, color: this.getContagiousColorRGB(contagious), icon: '🦠' },
      { label: 'Course', value: course, color: colors.accent, icon: '📈' }
    ];
    
    indicators.forEach((indicator, index) => {
      const x = 20 + (index * 60);
      const cardWidth = 55;
      const cardHeight = 20;
      
      // Card background
      doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
      doc.roundedRect(x, currentY - 5, cardWidth, cardHeight, 3, 3, 'F');
      
      // Card border
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(x, currentY - 5, cardWidth, cardHeight, 3, 3, 'S');
      
      // Label
      doc.setFontSize(8);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(indicator.label, x + 3, currentY);
      
      // Value with color
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(indicator.color[0], indicator.color[1], indicator.color[2]);
      doc.text(indicator.value, x + 3, currentY + 8);
    });

    /** ✅ Disease Description */
    currentY += 20;
    this.addCardHeader(doc, 'Disease Description', currentY, colors);
    currentY += 12;
    
    const description = this.response?.disease_info?.description || 'No description available';
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(description, pageWidth - 40);
    doc.text(descriptionLines, 20, currentY);

    /** ✅ Recommended Actions */
    currentY += descriptionLines.length * 4 + 10;
    this.addCardHeader(doc, 'Recommended Actions', currentY, colors);
    currentY += 12;
    
    const advice = this.response?.disease_info?.advice || 'No specific advice provided';
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const adviceLines = doc.splitTextToSize(advice, pageWidth - 40);
    doc.text(adviceLines, 20, currentY);

    /** ✅ Treatment Information */
    currentY += adviceLines.length * 4 + 15;
    
    // General Treatment
    const treatment = this.response?.treatment?.disease_treatment || {};
    if (Object.keys(treatment).length > 0) {
      this.addCardHeader(doc, 'General Treatment Plan', currentY, colors);
      currentY += 12;
      
      autoTable(doc, {
        startY: currentY,
        head: [['Treatment Detail', 'Information']],
        body: this.formatTreatmentData(treatment),
        theme: 'striped',
        margin: { left: 20, right: 20 },
        headStyles: { 
          fillColor: colors.primary, 
          textColor: colors.white, 
          fontSize: 11,
          fontStyle: 'bold',
          halign: 'left',
          cellPadding: 8
        },
        bodyStyles: { 
          textColor: colors.text, 
          fontSize: 10,
          cellPadding: 8,
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: colors.backgroundLight
        },
        columnStyles: {
          0: { 
            cellWidth: 70,
            fontStyle: 'bold',
            textColor: colors.primary
          },
          1: { 
            cellWidth: 100,
            textColor: colors.text
          }
        },
        styles: {
          lineColor: colors.border,
          lineWidth: 0.5
        }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    /** ✅ Symptom-specific Treatments */
    if (this.response?.treatment?.symptom_treatments) {
      const symptoms = Object.keys(this.response.treatment.symptom_treatments || {});
      
      symptoms.forEach((symptom) => {
        const sympData = this.response?.treatment?.symptom_treatments?.[symptom] || {};
        
        if (Object.keys(sympData).length > 0) {
          this.addCardHeader(doc, `Treatment for ${this.formatSymptom(symptom)}`, currentY, colors);
          currentY += 12;
          
          autoTable(doc, {
            startY: currentY,
            head: [['Treatment Detail', 'Information']],
            body: this.formatTreatmentData(sympData),
            theme: 'striped',
            margin: { left: 20, right: 20 },
            headStyles: { 
              fillColor: colors.primary, 
              textColor: colors.white, 
              fontSize: 11,
              fontStyle: 'bold',
              halign: 'left',
              cellPadding: 8
            },
            bodyStyles: { 
              textColor: colors.text, 
              fontSize: 10,
              cellPadding: 8,
              halign: 'left'
            },
            alternateRowStyles: {
              fillColor: colors.backgroundLight
            },
            columnStyles: {
              0: { 
                cellWidth: 70,
                fontStyle: 'bold',
                textColor: colors.primary
              },
              1: { 
                cellWidth: 100,
                textColor: colors.text
              }
            },
            styles: {
              lineColor: colors.border,
              lineWidth: 0.5
            }
          });
          
          currentY = (doc as any).lastAutoTable.finalY + 15;
        }
      });
    }

    /** ✅ Modern Footer */
    const finalY = (doc as any).lastAutoTable?.finalY || currentY;
    if (finalY < pageHeight - 40) {
      // Footer background
      doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
      doc.rect(0, pageHeight - 35, pageWidth, 35, 'F');
      
      // Footer border
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.setLineWidth(0.5);
      doc.line(0, pageHeight - 35, pageWidth, pageHeight - 35);
      
      // Nova logo area
      doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.rect(20, pageHeight - 30, 4, 20, 'F');
      
      // Main footer text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text('Nova AI Health Assistant', 30, pageHeight - 20);
      
      // Subtitle
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text('Medical Analysis Report', 30, pageHeight - 15);
      
      // Disclaimer
      doc.setFontSize(7);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text('This report is for informational purposes only. Please consult a healthcare professional.', pageWidth/2, pageHeight - 8, { align: 'center' });
      
      // Date
      doc.setFontSize(8);
      doc.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
      doc.text(`Generated on ${today}`, pageWidth - 20, pageHeight - 20, { align: 'right' });
    }

    /** ✅ Download */
    doc.save(`Nova_Medical_Analysis_${today.replace(/\//g, '-')}.pdf`);
  }

  private addCardHeader(doc: any, title: string, y: number, colors: any): void {
    // Simple title without container
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.text(title, 20, y);
    
    // Subtle underline
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(1);
    const titleWidth = doc.getTextWidth(title);
    doc.line(20, y + 2, 20 + titleWidth, y + 2);
  }

  private formatTreatmentData(treatment: any): any[][] {
    const fields = [
      { key: 'otc_medications', label: 'OTC Medications' },
      { key: 'prescription_medications', label: 'Prescription' },
      { key: 'alternative', label: 'Alternative' },
      { key: 'treatment_type', label: 'Type' },
      { key: 'dosage', label: 'Dosage' },
      { key: 'frequency', label: 'Frequency' },
      { key: 'recommended_duration', label: 'Duration' },
      { key: 'administration_route', label: 'Route' },
      { key: 'notes', label: 'Notes' }
    ];

    return fields
      .filter(field => treatment[field.key] && treatment[field.key] !== 'Not available' && treatment[field.key] !== 'NaN' && treatment[field.key] !== 'NA' && treatment[field.key] !== 'na')
      .map(field => [field.label, treatment[field.key] || 'Not specified']);
  }

  getSeverityColor(severity: string): string {
    const severityColors: { [key: string]: string } = {
      'Low': '#22c55e',      // green-500
      'Mild': '#22c55e',     // green-500
      'Moderate': '#fbbf24', // yellow/amber
      'High': '#ef4444',     // red-500
      'Severe': '#ef4444'    // red-500
    };
    return severityColors[severity] || '#6b7280'; // default gray
  }

  getSeverityColorRGB(severity: string): [number, number, number] {
    const severityColors: { [key: string]: [number, number, number] } = {
      'Low': [34, 197, 94],      // green-500
      'Mild': [34, 197, 94],     // green-500
      'Moderate': [251, 191, 36], // yellow/amber
      'High': [239, 68, 68],     // red-500
      'Severe': [239, 68, 68]    // red-500
    };
    return severityColors[severity] || [107, 114, 128]; // default gray
  }

  getContagiousColor(contagious: string): string {
    // Nettoyer la chaîne en supprimant les points et en normalisant la casse
    const cleanContagious = contagious?.replace(/\./g, '').trim().toLowerCase();
    
    const contagiousColors: { [key: string]: string } = {
      'yes': '#ef4444',      // red-500
      'no': '#22c55e',       // green-500
      'unknown': '#6b7280'   // gray
    };
    return contagiousColors[cleanContagious] || '#6b7280'; // default gray
  }

  getContagiousColorRGB(contagious: string): [number, number, number] {
    const contagiousColors: { [key: string]: [number, number, number] } = {
      'Yes': [239, 68, 68],      // red-500
      'No': [34, 197, 94],       // green-500
      'Unknown': [107, 114, 128] // gray
    };
    return contagiousColors[contagious] || [107, 114, 128]; // default gray
  }

  submitSymptomsToApi(): void {
    this.isSimulatedResponse = false; // Reset flag for real API calls
    this.loading = true;
    this.errorMessage = '';
    const formattedSymptoms = this.formatSymptoms(this.selectedSymptoms);
    const requestData = {
      symptoms: formattedSymptoms,
      age: this.age !== null ? Number(this.age) : null,
      sex: this.sex,
      weight: this.weight !== null ? Number(this.weight) : null,
      height: this.height !== null ? Number(this.height) : null,
      painLocations: this.selectedPainLocations,
      profile_id: this.selectedProfile?.id || null
    };

    this.http.post<any>('http://localhost:5000/api/nova/start', requestData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: (data) => {
        this.state = data.state || {};
        this.askedQuestions = data.question ? [data.question.question] : [];
        this.currentClarification = data.question || null;
        this.response = null;
        this.loading = false;
        

        if (this.currentClarification?.question) {
          this.pushAssistantClarificationAnimated(this.currentClarification.question);
        }
        this.scrollToBottomSoon();
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'An error occurred during the analysis.';
        this.loading = false;
      }
    });
  }

  answerClarification(value: boolean): void {
    if (!this.currentClarification) return;
    
    // Add user's response to the chat immediately
    this.messages.push({ role: 'user', type: 'text', content: value ? 'Yes' : 'No' });
    this.scrollToBottomSoon();
    
    this.showThinking(1000);
    this.markLastYesNoMessageAnswered('clarification');
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
      painLocations: this.selectedPainLocations,
      profile_id: this.selectedProfile?.id || null
    };

    this.loading = true;
    this.http.post<any>('http://localhost:5000/api/nova/refine', answerPayload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: (data) => {
        this.state = data.state || {};
        this.askedQuestions = data.asked_questions || [];
        if (data.final_prediction || data.predicted_disease) {
          this.response = data;
          this.currentClarification = null;
          
          // Add Quick Summary message first
          const quickSummaryContent = this.generateQuickSummaryContent();
          this.addAnimatedMessage({
            role: 'assistant',
            type: 'quickSummary',
            content: quickSummaryContent,
            isAnimating: true,
            displayedText: ''
          });
          
          // Note: Detailed analysis will be shown only when user clicks the button in Quick Summary
          // Trigger animations
          setTimeout(() => {
            if (this.response?.confidence) {
              this.animateConfidence(this.response.confidence * 100);
            }
            this.animateSeverity();
            this.animateContagiousGauge();
            this.animateCourseGauge();
            // Render demographic charts if data is available
            if (this.response?.disease_info?.demographics) {
              setTimeout(() => {
                this.renderDemographicCharts();
              }, 100);
            }
          }, 50);
        } else {
          this.currentClarification = data.question || null;
          if (this.currentClarification?.question) {
            this.askedQuestions.push(this.currentClarification.question);
            this.pushAssistantClarificationAnimated(this.currentClarification.question);
          }
        }
        this.loading = false;
        this.scrollToBottomSoon();
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
    this.messages = [];
    this.showDemographicsSection = false;
    this.showGenderChart = false;
    this.showAgeChart = false;
    
    // Mettre à jour les permissions d'analyse après réinitialisation
    this.checkAnalysisLimitations();
    
    this.pushAssistantTextAnimated("Hello, describe your symptoms. Add several items and send.");
    this.scrollToBottomSoon();
  }


  private scrollToBottomSoon(): void {
    setTimeout(() => {
      try {
        this.scrollAnchor?.nativeElement.scrollIntoView({ behavior: 'smooth' });
      } catch {}
    }, 0);
  }

  private markLastYesNoMessageAnswered(kind: 'clarification' | 'pain'): void {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg.role === 'assistant' && msg.type === kind) {
        msg.answered = true;
        break;
      }
    }
  }

  private stripLastTypingIndicator(): void {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg.role === 'assistant' && msg.type === 'text' && msg.content === '...') {
        this.messages.splice(i, 1);
        break;
      }
    }
  }

  private markLastMessageAnswered(kind: 'bodySelection'): void {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg.role === 'assistant' && msg.type === kind) {
        msg.answered = true;
        break;
      }
    }
  }

  // Result view navigation handlers used by template
  nextResultView(): void {
    const views = this.getAvailableResultViews();
    const idx = views.indexOf(this.currentResultView);
    this.currentResultView = views[(idx + 1) % views.length];
    if (this.currentResultView === 'demographics') {
      // ✅ Utiliser la méthode de forçage pour s'assurer que les graphiques apparaissent
      this.forceRenderCharts();
    }
  }

  prevResultView(): void {
    const views = this.getAvailableResultViews();
    const idx = views.indexOf(this.currentResultView);
    this.currentResultView = views[(idx - 1 + views.length) % views.length];
    if (this.currentResultView === 'demographics') {
      // ✅ Utiliser la méthode de forçage pour s'assurer que les graphiques apparaissent
      this.forceRenderCharts();
    }
  }

  private getAvailableResultViews(): ('result' | 'demographics' | 'treatments')[] {
    const views: ('result' | 'demographics' | 'treatments')[] = ['result'];
    if (this.response?.disease_info?.demographics) views.push('demographics');
    if (this.hasDiseaseTreatment || this.hasSymptomTreatments) views.push('treatments');
    return views;
  }

  private showThinking(durationMs: number = 1000): void {
    this.thinking = true;
    setTimeout(() => {
      this.thinking = false;
    }, durationMs);
  }



  // Extras prompt handler
  answerExtras(value: boolean): void {
    // find last extras prompt
    for (let i = this.messages.length - 1; i >= 0; i--) {
      const msg = this.messages[i];
      if (msg.role === 'assistant' && msg.type === 'extras' && !msg.answered) {
        msg.answered = true;
        break;
      }
    }
    this.messages.push({ role: 'user', type: 'text', content: value ? 'Yes' : 'No' });
    this.scrollToBottomSoon();
    if (!value) {
      return;
    }
    // Show demographics if available
    if (this.response?.disease_info?.demographics) {
      this.messages.push({ role: 'assistant', type: 'demographics', content: 'Disease demographics overview' });
      setTimeout(() => {
        this.renderDemographicCharts();
      }, 0);
    }
    // Show treatments if available
    if (this.hasDiseaseTreatment || this.hasSymptomTreatments) {
      this.messages.push({ role: 'assistant', type: 'treatments', content: 'Treatment plan overview' });
    }
    this.scrollToBottomSoon();
  }

  // Typewriter animation methods
  private calculateAdaptiveSpeed(textLength: number): number {
    // If this is a simulated response, make typing instant
    if (this.isSimulatedResponse) {
      console.log(`Simulated response detected - instant typing for ${textLength} characters`);
      return 0; // Instant typing
    }
    
    let speed: number;
    
    // Base speed for short texts (0-100 chars)
    if (textLength <= 100) {
      speed = this.typewriterSpeed;
    }
    // Faster speed for medium texts (100-300 chars)
    else if (textLength <= 300) {
      speed = Math.max(1, this.typewriterSpeed * 0.5);
    }
    // Even faster for long texts (300-600 chars)
    else if (textLength <= 600) {
      speed = Math.max(0.5, this.typewriterSpeed * 0.3);
    }
    // Very fast for long texts (600-1000 chars)
    else if (textLength <= 1000) {
      speed = Math.max(0.3, this.typewriterSpeed * 0.2);
    }
    // Fastest for very long texts (1000+ chars)
    else {
      speed = Math.max(0.1, this.typewriterSpeed * 0.1);
    }
    
    // Debug log to verify adaptive speed is working
    console.log(`Text length: ${textLength}, Base speed: ${this.typewriterSpeed}ms, Adaptive speed: ${speed}ms`);
    
    return speed;
  }

  private animateText(message: AnimatedMessage): void {
    // Don't start if already animating (prevent double animation)
    if (message.isAnimating && message.displayedText && message.displayedText.length > 0) return;
    
    message.isAnimating = true;
    message.displayedText = '';
    
    // If this is a simulated response, display text instantly
    if (this.isSimulatedResponse) {
      message.displayedText = message.content;
      message.isAnimating = false;
      this.scrollToBottomSoon();
      console.log('Simulated response - text displayed instantly');
      return;
    }
    
    // Special handling for quickSummary to avoid showing HTML tags during animation
    if (message.type === 'quickSummary') {
      this.animateQuickSummaryText(message);
      return;
    }
    
    const fullText = message.content;
    const adaptiveSpeed = this.calculateAdaptiveSpeed(fullText.length);
    let currentIndex = 0;
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        message.displayedText = fullText.substring(0, currentIndex + 1);
        currentIndex++;
        this.typewriterAnimation = setTimeout(typeNextChar, adaptiveSpeed);
        this.scrollToBottomSoon();
      } else {
        message.isAnimating = false;
        this.typewriterAnimation = null;
      }
    };
    
    // Start immediately
    typeNextChar();
  }

  private animateQuickSummaryText(message: AnimatedMessage): void {
    // If this is a simulated response, display text instantly
    if (this.isSimulatedResponse) {
      message.displayedText = message.content;
      message.isAnimating = false;
      this.scrollToBottomSoon();
      console.log('Simulated response - Quick Summary displayed instantly');
      return;
    }
    
    const fullText = message.content;
    const adaptiveSpeed = this.calculateAdaptiveSpeed(fullText.length);
    let currentIndex = 0;
    let inTag = false;
    let currentTag = '';
    
    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        const char = fullText[currentIndex];
        
        if (char === '<') {
          inTag = true;
          currentTag = '<';
        } else if (char === '>') {
          inTag = false;
          currentTag += '>';
          // Add the complete tag at once without delay
          message.displayedText += currentTag;
          currentTag = '';
          // Continue immediately for tags to avoid saccades
          currentIndex++;
          typeNextChar();
          return;
        } else if (inTag) {
          currentTag += char;
        } else {
          message.displayedText += char;
        }
        
        currentIndex++;
        this.typewriterAnimation = setTimeout(typeNextChar, adaptiveSpeed);
        this.scrollToBottomSoon();
      } else {
        message.isAnimating = false;
        this.typewriterAnimation = null;
      }
    };
    
    // Start immediately
    typeNextChar();
  }

  addAnimatedMessage(message: AnimatedMessage): void {
    this.messages.push(message);
    this.scrollToBottomSoon();
    
    // Start animation after a short delay
    setTimeout(() => this.animateText(message), 50);
  }

  isDetailedAnalysisVisible(): boolean {
    return this.messages.some(m => m.role === 'assistant' && m.type === 'result');
  }

  showDetailedAnalysis(): void {
    // Check if detailed analysis is already shown
    const hasDetailedAnalysis = this.isDetailedAnalysisVisible();
    
    if (hasDetailedAnalysis) {
      // Remove the detailed analysis message
      this.messages = this.messages.filter(m => !(m.role === 'assistant' && m.type === 'result'));
    } else {
      // Add the result message to display the detailed analysis
      this.messages.push({ role: 'assistant', type: 'result', content: 'Here are your results.' });
      this.currentResultView = 'result';
      
      // Reset confidence to 0 and trigger animations
      this.animatedConfidence = 0;
      setTimeout(() => {
        if (this.response?.confidence) {
          this.animateConfidence(this.response.confidence * 100);
        }
        this.animateSeverity();
        this.animateContagiousGauge();
        this.animateCourseGauge();
        // Render demographic charts if data is available
        if (this.response?.disease_info?.demographics) {
          setTimeout(() => {
            this.renderDemographicCharts();
          }, 100);
        }
      }, 50);
    }
    
    this.scrollToBottomSoon();
  }

  private pushAssistantTextAnimated(content: string): void {
    // Add message with avatar immediately, but without text
    const message: AnimatedMessage = {
      role: 'assistant',
      type: 'text',
      content,
      isAnimating: false,
      displayedText: ''
    };
    this.messages.push(message);
    this.scrollToBottomSoon();
    
    // Show thinking spinner
    this.thinking = true;
    setTimeout(() => {
      this.thinking = false;
      // Start animation immediately after DOM update
      setTimeout(() => this.animateText(message), 50);
    }, 1000);
  }

  private pushAssistantImmediateTextAnimated(content: string): void {
    const message: AnimatedMessage = {
      role: 'assistant',
      type: 'text',
      content,
      isAnimating: false,
      displayedText: ''
    };
    this.messages.push(message);
    this.scrollToBottomSoon();
    // Start animation immediately after DOM update
    setTimeout(() => this.animateText(message), 50);
  }

  private pushAssistantClarificationAnimated(content: string): void {
    // Add message with avatar immediately, but without text
    const message: AnimatedMessage = {
      role: 'assistant',
      type: 'clarification',
      content,
      answered: false,
      isAnimating: true,
      displayedText: ''
    };
    this.messages.push(message);
    this.scrollToBottomSoon();
    
    // Show thinking spinner
    this.thinking = true;
    setTimeout(() => {
      this.thinking = false;
      // Start animation immediately after DOM update
      setTimeout(() => this.animateText(message), 50);
    }, 1000);
  }

  private pushAssistantPainAnimated(content: string): void {
    // Add message with avatar immediately, but without text
    const message: AnimatedMessage = {
      role: 'assistant',
      type: 'pain',
      content,
      answered: false,
      isAnimating: true,
      displayedText: ''
    };
    this.messages.push(message);
    this.scrollToBottomSoon();
    
    // Show thinking spinner
    this.thinking = true;
    setTimeout(() => {
      this.thinking = false;
      // Start animation immediately after DOM update
      setTimeout(() => this.animateText(message), 50);
    }, 1000);
  }

  private pushAssistantBodySelectionAnimated(content: string): void {
    // Add message with avatar immediately, but without text
    const message: AnimatedMessage = {
      role: 'assistant',
      type: 'bodySelection',
      content,
      answered: false,
      isAnimating: true,
      displayedText: ''
    };
    this.messages.push(message);
    this.scrollToBottomSoon();
    
    // Show thinking spinner
    this.thinking = true;
    setTimeout(() => {
      this.thinking = false;
      // Start animation immediately after DOM update
      setTimeout(() => this.animateText(message), 50);
    }, 1000);
  }

  private pushAssistantExtrasAnimated(content: string): void {
    // Add message with avatar immediately, but without text
    const message: AnimatedMessage = {
      role: 'assistant',
      type: 'extras',
      content,
      answered: false,
      isAnimating: true,
      displayedText: ''
    };
    this.messages.push(message);
    this.scrollToBottomSoon();
    
    // Show thinking spinner
    this.thinking = true;
    setTimeout(() => {
      this.thinking = false;
      // Start animation immediately after DOM update
      setTimeout(() => this.animateText(message), 50);
    }, 1000);
  }

  // Helper method to check if message is extras type
  isExtrasMessage(message: AnimatedMessage): boolean {
    return message.type === 'extras';
  }

  // Modal methods
  openDescriptionModal(description: string): void {
    this.currentModalDescription = description;
    this.showDescriptionModal = true;
  }

  closeDescriptionModal(): void {
    this.showDescriptionModal = false;
    this.currentModalDescription = '';
  }

  // Confidence modal methods
  openConfidenceModal(): void {
    this.showConfidenceModal = true;
  }

  closeConfidenceModal(): void {
    this.showConfidenceModal = false;
  }

  // Get descriptions for each tab
  getTabDescription(tab: string): string {
    switch (tab) {
      case 'result':
        return 'This section presents the outcome of the symptom analysis, including the most likely diagnosis, its severity, and related clinical information. It is derived from your input and enhanced by contextual medical data to offer an accurate, data-driven health insight.';
      case 'demographics':
        return 'This section illustrates the typical demographic distribution of the predicted disease, highlighting which age groups and genders are most commonly affected. The charts show statistical data about disease prevalence across different population segments.';
      case 'treatments':
        return 'This section outlines the most commonly recommended treatments for the predicted disease, including general approaches and symptom-specific strategies. It provides detailed information about medications, dosages, and treatment protocols.';
      default:
        return '';
    }
  }

  // Enhanced textarea interaction methods
  onTextareaFocus(): void {
    // Add any focus-specific logic here
    console.log('Textarea focused');
  }

  onTextareaBlur(): void {
    // Add any blur-specific logic here
    console.log('Textarea blurred');
  }

  onTextareaKeydown(event: KeyboardEvent): void {
    // Check if Enter key is pressed without Shift
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault(); // Prevent new line
      if (this.freeTextSymptoms.trim()) {
        this.extractSymptomsFromFreeText();
      }
    }
  }

  // Check if any symptoms are selected
  hasSelectedSymptoms(): boolean {
    return this.extractedRecognized.some(item => item.selected);
  }

  // Check authentication status and load profiles
  checkAuthStatus(): void {
    this.authService.isLoggedIn().subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
      if (isLoggedIn) {
        // Check if token exists before making API calls
        const token = this.authService.getToken();
        if (token) {
          this.loadCurrentUser();
          this.loadUserProfiles();
        } else {
          // Token doesn't exist, treat as not logged in
          this.isLoggedIn = false;
          this.resetUserData();
        }
      } else {
        this.resetUserData();
      }
    });
  }

  // Reset user data when not authenticated
  resetUserData(): void {
    this.currentUser = null;
    this.userProfiles = [];
    this.selectedProfile = null;
    this.canPerformAnalysis = true; // Allow analysis for non-authenticated users
    this.isTimerLoading = false; // No timer needed for non-authenticated users
    this.isPageLoading = false; // Hide page loading
    console.log('User not logged in, allowing analysis');
  }

  // Load current user information
  loadCurrentUser(): void {
    const token = this.authService.getToken();
    if (!token) {
      console.log('No token found, user not authenticated');
      this.isLoggedIn = false;
      this.resetUserData();
      return;
    }
    
    this.http.get<any>('http://localhost:5000/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.checkUserLimitations();
        this.isPageLoading = false; // Hide page loading when user is loaded
      },
      error: (err) => {
        if (err.status === 401) {
          console.log('Token expired or invalid, logging out user');
          this.isLoggedIn = false;
          this.resetUserData();
          // Optionally logout from auth service
          this.authService.logout();
        } else {
          console.log('Error loading user:', err.status);
        }
      }
    });
  }

  // Check user limitations based on subscription plan
  checkUserLimitations(): void {
    if (!this.currentUser) return;

    const plan = this.currentUser.subscription_plan;
    const maxProfiles = this.currentUser.max_profiles || 1;

    // Check if user can create more profiles
    this.canCreateProfile = this.userProfiles.length < maxProfiles;

    // Check analysis limitations
    this.checkAnalysisLimitations();
  }

  // Load Premium analysis count from localStorage
  loadPremiumAnalysisCount(): void {
    const stored = localStorage.getItem('premiumAnalysesWithoutProfile');
    this.premiumAnalysesWithoutProfile = stored ? parseInt(stored, 10) : 0;
  }

  // Save Premium analysis count to localStorage
  savePremiumAnalysisCount(): void {
    localStorage.setItem('premiumAnalysesWithoutProfile', this.premiumAnalysesWithoutProfile.toString());
  }

  // Check if Premium user has reached limit without profile
  isPremiumLimitReached(): boolean {
    return this.isLoggedIn && 
           this.currentUser?.subscription_plan === 'premium' && 
           !this.selectedProfile && 
           this.premiumAnalysesWithoutProfile >= 5;
  }

  // Update analysis permissions when profile selection changes
  updateAnalysisPermissions(): void {
    if (this.currentUser?.subscription_plan === 'premium') {
      this.canPerformAnalysis = !this.isPremiumLimitReached();
    }
  }

  // Check analysis limitations
  checkAnalysisLimitations(): void {
    if (!this.currentUser) return;

    const plan = this.currentUser.subscription_plan;
    const now = new Date();

    switch (plan) {
      case 'free':
        // 1 analysis every 5 hours
        if (this.lastAnalysisTime) {
          const timeDiff = now.getTime() - this.lastAnalysisTime.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          this.canPerformAnalysis = hoursDiff >= 5;
        } else {
          this.canPerformAnalysis = true;
        }
        break;
      case 'premium':
        // Unlimited analyses with profile, 5 analyses max without profile
        this.loadPremiumAnalysisCount();
        this.canPerformAnalysis = !this.isPremiumLimitReached();
        break;
      case 'enterprise':
        // Unlimited analyses
        this.canPerformAnalysis = true;
        break;
      default:
        this.canPerformAnalysis = false;
    }

    // Start countdown for free plan users
    if (plan === 'free') {
      this.startCountdownTimer();
    } else {
      // For non-free plans, no timer needed
      this.isTimerLoading = false;
    }
  }

  // Load user profiles
  loadUserProfiles(): void {
    this.loadingProfiles = true;
    
    const token = this.authService.getToken();
    if (!token) {
      console.log('No token found, cannot load profiles');
      this.loadingProfiles = false;
      this.isLoggedIn = false;
      this.resetUserData();
      return;
    }
    
    this.http.get<any[]>('http://localhost:5000/api/profiles', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (profiles) => {
        this.userProfiles = profiles;
        this.loadingProfiles = false;
        this.checkUserLimitations(); // Re-check limitations after loading profiles
        this.isPageLoading = false; // Hide page loading when profiles are loaded
      },
      error: (err) => {
        this.loadingProfiles = false;
        if (err.status === 401) {
          console.log('Token expired or invalid, logging out user');
          this.isLoggedIn = false;
          this.resetUserData();
          this.authService.logout();
        } else {
          console.log('Error loading profiles:', err.status);
          this.userProfiles = [];
        }
      }
    });
  }

  // Select a profile
  selectProfile(profile: any): void {
    if (profile === null) {
      // Back to profile selection
      this.selectedProfile = null;
      this.showManualEntry = false;
      this.updateAnalysisPermissions();
      return;
    }
    
    this.selectedProfile = profile;
    this.showManualEntry = false;
    this.updateAnalysisPermissions();
    
    console.log('Selected profile:', profile);
    
    if (profile && profile.birth_date) {
      // Calculate age from birth_date
      const birthDate = new Date(profile.birth_date);
      const today = new Date();
      this.age = today.getFullYear() - birthDate.getFullYear();
      this.sex = profile.sex;
      this.weight = parseFloat(profile.weight) || null;
      this.height = parseFloat(profile.height) || null;
      
      console.log('Profile data loaded:', {
        age: this.age,
        sex: this.sex,
        weight: this.weight,
        height: this.height,
        rawProfile: profile
      });
    }
  }

  // Select manual entry
  selectManualEntry(): void {
    this.selectedProfile = null;
    this.showManualEntry = true;
    this.updateAnalysisPermissions();
    // Reset form fields
    this.age = null;
    this.sex = '';
    this.weight = null;
    this.height = null;
  }

  // Navigate to account page
  goToAccount(): void {
    this.router.navigate(['/account']);
  }

  // Navigate to login page
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Get plan limitations info
  getPlanInfo(): any {
    if (!this.currentUser) return null;
    
    const plan = this.currentUser.subscription_plan;
    switch (plan) {
      case 'free':
        return {
          name: 'Free',
          maxProfiles: 1,
          analysisLimit: '1 analysis every 5 hours',
          hasHistory: false
        };
      case 'premium':
        return {
          name: 'Premium',
          maxProfiles: 5,
          analysisLimit: 'Unlimited analyses with profile, 5 max without profile',
          hasHistory: true
        };
      case 'enterprise':
        return {
          name: 'Enterprise',
          maxProfiles: -1, // Unlimited
          analysisLimit: 'Unlimited analyses',
          hasHistory: true
        };
      default:
        return null;
    }
  }

  // Calculate initial time until next analysis (called once at load)
  calculateInitialTimeUntilNextAnalysis(): number {
    if (!this.currentUser || this.currentUser.subscription_plan !== 'free') {
      return 0;
    }

    // If no lastAnalysisTime, create a fake one for testing (4 hours ago)
    let testLastAnalysisTime = this.lastAnalysisTime;
    if (!testLastAnalysisTime) {
      testLastAnalysisTime = new Date(Date.now() - 4 * 60 * 60 * 1000); // 4 hours ago
    }

    const now = new Date();
    const timeDiff = now.getTime() - testLastAnalysisTime.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    const remainingHours = 5 - hoursDiff;

    if (remainingHours <= 0) return 0;

    // Return total seconds remaining
    return Math.floor(remainingHours * 60 * 60);
  }

  // Format seconds into readable time string
  formatTimeFromSeconds(totalSeconds: number): string {
    if (totalSeconds <= 0) return '';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Start countdown timer (local countdown, no database calls)
  startCountdownTimer(): void {
    // Clear any existing timer
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    // Show loading state
    this.isTimerLoading = true;

    // Simulate loading delay for better UX
    setTimeout(() => {
      // Calculate initial time remaining
      this.timeUntilNextAnalysisSeconds = this.calculateInitialTimeUntilNextAnalysis();
      
      if (this.timeUntilNextAnalysisSeconds <= 0) {
        this.timeUntilNextAnalysis = '';
        this.isTimerLoading = false;
        return;
      }

      // Update display immediately
      this.timeUntilNextAnalysis = this.formatTimeFromSeconds(this.timeUntilNextAnalysisSeconds);
      this.isTimerLoading = false;

      // Store the start time for more accurate timing
      const startTime = Date.now();
      const targetEndTime = startTime + (this.timeUntilNextAnalysisSeconds * 1000);

      // Start countdown with more precise timing
      this.countdownInterval = setInterval(() => {
        const currentTime = Date.now();
        const remainingMs = targetEndTime - currentTime;
        const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
        
        if (remainingSeconds <= 0) {
          this.timeUntilNextAnalysis = '';
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
          // Optionally refresh the page or update canPerformAnalysis
          this.checkAnalysisLimitations();
        } else {
          this.timeUntilNextAnalysis = this.formatTimeFromSeconds(remainingSeconds);
        }
      }, 1000); // Update every second
    }, 800); // 800ms loading delay
  }

  // Stop countdown timer
  stopCountdownTimer(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  // Navigate to subscription page
  goToSubscription(): void {
    this.router.navigate(['/subscription']);
  }

  // Load last analysis time from localStorage
  loadLastAnalysisTime(): void {
    const lastAnalysisTimeStr = localStorage.getItem('lastAnalysisTime');
    if (lastAnalysisTimeStr) {
      this.lastAnalysisTime = new Date(lastAnalysisTimeStr);
    }
  }

  // Treatment container classes for full width when alone
  getTreatmentContainerClasses(treatment: any, type: string): string {
    const hasMedications = this.hasMedicationsData(treatment);
    const hasPosology = this.hasPosologyData(treatment);
    const hasPrecautions = this.hasPrecautionsData(treatment);
    const hasNotes = this.hasNotesData(treatment);
    
    const visibleContainers = [hasMedications, hasPosology, hasPrecautions, hasNotes].filter(Boolean).length;
    
    // If only one container is visible, make it full width
    if (visibleContainers === 1) {
      return 'bg-white/5 border border-white/10 rounded-lg p-4 col-span-2';
    }
    
    // If 3 containers are visible, the last one should be full width
    if (visibleContainers === 3) {
      const containerOrder = ['medications', 'posology', 'precautions', 'notes'];
      const visibleTypes = [];
      
      if (hasMedications) visibleTypes.push('medications');
      if (hasPosology) visibleTypes.push('posology');
      if (hasPrecautions) visibleTypes.push('precautions');
      if (hasNotes) visibleTypes.push('notes');
      
      // If this is the last visible container, make it full width
      if (visibleTypes[visibleTypes.length - 1] === type) {
        return 'bg-white/5 border border-white/10 rounded-lg p-4 col-span-2';
      }
    }
    
    return 'bg-white/5 border border-white/10 rounded-lg p-4';
  }

  getSymptomContainerClasses(symptomTreatment: any, type: string): string {
    const hasMedications = this.hasSymptomMedicationsData(symptomTreatment);
    const hasPosology = this.hasSymptomPosologyData(symptomTreatment);
    const hasPrecautions = this.hasSymptomPrecautionsData(symptomTreatment);
    const hasNotes = this.hasSymptomNotesData(symptomTreatment);
    
    const visibleContainers = [hasMedications, hasPosology, hasPrecautions, hasNotes].filter(Boolean).length;
    
    // If only one container is visible, make it full width
    if (visibleContainers === 1) {
      return 'bg-white/5 border border-white/10 rounded-lg p-4 col-span-2';
    }
    
    // If 3 containers are visible, the last one should be full width
    if (visibleContainers === 3) {
      const containerOrder = ['medications', 'posology', 'precautions', 'notes'];
      const visibleTypes = [];
      
      if (hasMedications) visibleTypes.push('medications');
      if (hasPosology) visibleTypes.push('posology');
      if (hasPrecautions) visibleTypes.push('precautions');
      if (hasNotes) visibleTypes.push('notes');
      
      // If this is the last visible container, make it full width
      if (visibleTypes[visibleTypes.length - 1] === type) {
        return 'bg-white/5 border border-white/10 rounded-lg p-4 col-span-2';
      }
    }
    
    return 'bg-white/5 border border-white/10 rounded-lg p-4';
  }

  // Helper methods to check if data exists
  hasMedicationsData(treatment: any): boolean {
    return (treatment.otc_medications && treatment.otc_medications !== 'NaN' && treatment.otc_medications !== 'NA' && treatment.otc_medications !== 'na' && treatment.otc_medications.trim() !== '') ||
           (treatment.prescription_medications && treatment.prescription_medications !== 'NaN' && treatment.prescription_medications !== 'NA' && treatment.prescription_medications !== 'na' && treatment.prescription_medications.trim() !== '') ||
           (treatment.alternative && treatment.alternative !== 'NaN' && treatment.alternative !== 'NA' && treatment.alternative !== 'na' && treatment.alternative.trim() !== '') ||
           (treatment.treatment_type && treatment.treatment_type !== 'NaN' && treatment.treatment_type !== 'NA' && treatment.treatment_type !== 'na' && treatment.treatment_type.trim() !== '');
  }

  hasPosologyData(treatment: any): boolean {
    return (treatment.dosage && treatment.dosage !== 'NaN' && treatment.dosage !== 'NA' && treatment.dosage !== 'na' && treatment.dosage.trim() !== '') ||
           (treatment.frequency && treatment.frequency !== 'NaN' && treatment.frequency !== 'NA' && treatment.frequency !== 'na' && treatment.frequency.trim() !== '') ||
           (treatment.recommended_duration && treatment.recommended_duration !== 'NaN' && treatment.recommended_duration !== 'NA' && treatment.recommended_duration !== 'na' && treatment.recommended_duration.trim() !== '') ||
           (treatment.administration_route && treatment.administration_route !== 'NaN' && treatment.administration_route !== 'NA' && treatment.administration_route !== 'na' && treatment.administration_route.trim() !== '');
  }

  hasPrecautionsData(treatment: any): boolean {
    return (treatment.side_effects && treatment.side_effects !== 'NaN' && treatment.side_effects !== 'NA' && treatment.side_effects !== 'na' && treatment.side_effects.trim() !== '') ||
           (treatment.driving_restrictions && treatment.driving_restrictions !== 'NaN' && treatment.driving_restrictions !== 'NA' && treatment.driving_restrictions !== 'na' && treatment.driving_restrictions.trim() !== '');
  }

  hasNotesData(treatment: any): boolean {
    return treatment.notes && treatment.notes !== 'NaN' && treatment.notes !== 'NA' && treatment.notes !== 'na' && treatment.notes.trim() !== '';
  }

  hasSymptomMedicationsData(symptomTreatment: any): boolean {
    return (symptomTreatment.otc_medications && symptomTreatment.otc_medications !== 'NaN' && symptomTreatment.otc_medications !== 'NA' && symptomTreatment.otc_medications !== 'na' && symptomTreatment.otc_medications.trim() !== '') ||
           (symptomTreatment.prescription_medications && symptomTreatment.prescription_medications !== 'NaN' && symptomTreatment.prescription_medications !== 'NA' && symptomTreatment.prescription_medications !== 'na' && symptomTreatment.prescription_medications.trim() !== '') ||
           (symptomTreatment.alternative && symptomTreatment.alternative !== 'NaN' && symptomTreatment.alternative !== 'NA' && symptomTreatment.alternative !== 'na' && symptomTreatment.alternative.trim() !== '') ||
           (symptomTreatment.treatment_type && symptomTreatment.treatment_type !== 'NaN' && symptomTreatment.treatment_type !== 'NA' && symptomTreatment.treatment_type !== 'na' && symptomTreatment.treatment_type.trim() !== '');
  }

  hasSymptomPosologyData(symptomTreatment: any): boolean {
    return (symptomTreatment.dosage && symptomTreatment.dosage !== 'NaN' && symptomTreatment.dosage !== 'NA' && symptomTreatment.dosage !== 'na' && symptomTreatment.dosage.trim() !== '') ||
           (symptomTreatment.frequency && symptomTreatment.frequency !== 'NaN' && symptomTreatment.frequency !== 'NA' && symptomTreatment.frequency !== 'na' && symptomTreatment.frequency.trim() !== '') ||
           (symptomTreatment.recommended_duration && symptomTreatment.recommended_duration !== 'NaN' && symptomTreatment.recommended_duration !== 'NA' && symptomTreatment.recommended_duration !== 'na' && symptomTreatment.recommended_duration.trim() !== '') ||
           (symptomTreatment.administration_route && symptomTreatment.administration_route !== 'NaN' && symptomTreatment.administration_route !== 'NA' && symptomTreatment.administration_route !== 'na' && symptomTreatment.administration_route.trim() !== '');
  }

  hasSymptomPrecautionsData(symptomTreatment: any): boolean {
    return (symptomTreatment.side_effects && symptomTreatment.side_effects !== 'NaN' && symptomTreatment.side_effects !== 'NA' && symptomTreatment.side_effects !== 'na' && symptomTreatment.side_effects.trim() !== '') ||
           (symptomTreatment.driving_restrictions && symptomTreatment.driving_restrictions !== 'NaN' && symptomTreatment.driving_restrictions !== 'NA' && symptomTreatment.driving_restrictions !== 'na' && symptomTreatment.driving_restrictions.trim() !== '');
  }

  hasSymptomNotesData(symptomTreatment: any): boolean {
    return symptomTreatment.notes && symptomTreatment.notes !== 'NaN' && symptomTreatment.notes !== 'NA' && symptomTreatment.notes !== 'na' && symptomTreatment.notes.trim() !== '';
  }


}
