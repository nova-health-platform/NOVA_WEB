import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { TestResultsService } from '../services/test-results.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-psy-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './psy-test.component.html',
  styleUrls: ['./psy-test.component.scss']
})
export class PsyTestComponent implements OnInit {
  activeModal: 'phq' | 'smart' | 'gad7' | 'dass21' | 'isi' | 'burnout' | null = null;
  readonly modalContent: Record<'phq' | 'smart' | 'gad7' | 'dass21' | 'isi' | 'burnout', {
    tagline: string;
    title: string;
    description: string;
  }> = {
    smart: {
      tagline: 'Smart Insight',
      title: 'About Smart Prediction',
      description: `This tool uses a machine learning model trained on anonymous questionnaire data to suggest patterns or trends in your mental state. It doesn't provide a diagnosis, but offers insights to reflect on or discuss with a professional.`
    },
    phq: {
      tagline: 'Depression Screening',
      title: 'About PHQ-9',
      description: `The PHQ-9 (Patient Health Questionnaire) is a brief self-assessment tool designed to identify symptoms of depression. It's commonly used in clinical practice and helps individuals understand whether they might be experiencing depressive episodes.`
    },
    gad7: {
      tagline: 'Anxiety Assessment',
      title: 'About GAD-7',
      description: `The GAD-7 (Generalized Anxiety Disorder 7-item scale) is a validated self-assessment tool that helps screen for anxiety severity. It evaluates how often you've felt excessive worry, restlessness, or difficulty relaxing. GAD-7 is widely used by professionals to initiate discussions about mental health.`
    },
    dass21: {
      tagline: 'Stress · Anxiety · Depression',
      title: 'About DASS-21',
      description: `The DASS-21 (Depression, Anxiety and Stress Scale – 21 items) is a scientifically validated tool that provides insights across three emotional states. It breaks down how you experience stress, anxiety, and depression, helping you recognize which area might need attention. It's ideal for gaining a more complete picture of your psychological health.`
    },
    isi: {
      tagline: 'Sleep Quality',
      title: 'About ISI',
      description: `The Insomnia Severity Index (ISI) is a brief and reliable screening tool that evaluates sleep issues such as difficulty falling asleep, maintaining sleep, and waking up too early. It also asks about how much these problems affect your daily functioning, mood, and overall quality of life. It's often used in clinical and research settings.`
    },
    burnout: {
      tagline: 'Work & Stress',
      title: 'About Burnout',
      description: `Burnout is a state of emotional, mental, and physical exhaustion caused by prolonged stress — particularly from work. This questionnaire helps assess symptoms such as lack of motivation, reduced performance, and detachment. Identifying burnout early can be key to restoring balance and preventing long-term consequences.`
    }
  };

  profiles: any[] = [];
  profilesLoading = false;
  profilesError = '';
  isAuthenticated = false;
  selectedProfileId: number | null = null;

  constructor(
    private http: HttpClient,
    private testResultsService: TestResultsService,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.selectedProfileId = this.testResultsService.getActiveProfileId();
    this.loadProfiles();
  }

  openModal(id: 'phq' | 'smart' | 'gad7' | 'dass21' | 'isi' | 'burnout') {
    this.activeModal = id;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.activeModal = null;
    document.body.style.overflow = '';
  }

  loadProfiles(): void {
    const token = localStorage.getItem('access_token');
    if (!token) {
      this.isAuthenticated = false;
      this.profiles = [];
      this.profilesError = '';
      this.selectedProfileId = null;
      this.testResultsService.setActiveProfileId(null);
      return;
    }

    this.isAuthenticated = true;
    this.profilesLoading = true;
    this.profilesError = '';

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    this.http.get<any[]>('http://localhost:5000/api/profiles', { headers }).subscribe({
      next: (profiles) => {
        this.profiles = profiles;
        if (!profiles.some(p => p.id === this.selectedProfileId)) {
          this.selectedProfileId = null;
        }
        if (!this.selectedProfileId && profiles.length === 1) {
          this.onSelectProfile(profiles[0]);
        }
      },
      error: (error) => {
        if (error.status === 401) {
          this.isAuthenticated = false;
          this.profilesError = 'Veuillez vous connecter pour sélectionner un profil.';
          this.selectedProfileId = null;
          this.testResultsService.setActiveProfileId(null);
        } else {
          this.profilesError = 'Impossible de charger les profils.';
        }
      },
      complete: () => {
        this.profilesLoading = false;
      }
    });
  }

  onSelectProfile(profile: any): void {
    this.selectedProfileId = profile.id;
    this.testResultsService.setActiveProfileId(profile.id);
  }

  onSelectProfileById(id: string): void {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) {
      return;
    }
    const profile = this.profiles.find(p => p.id === numericId);
    if (profile) {
      this.onSelectProfile(profile);
    }
  }

  get activeProfileName(): string | null {
    const profile = this.profiles.find(p => p.id === this.selectedProfileId);
    return profile ? `${profile.first_name} ${profile.last_name}` : null;
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToTest(route: string): void {
    if (this.isAuthenticated) {
      this.router.navigate([route]);
    } else {
      this.router.navigate(['/login']);
    }
  }
}



