import { Component, ElementRef, ViewChild, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { HistoryService, HistoryEntry } from '../services/history.service';
import { ImageQualityService, ImageQualityMetrics } from '../services/image-quality.service';
import { RiskScoreComponent } from './components/risk-score/risk-score.component';
import { TriageAdviceComponent } from './components/triage-advice/triage-advice.component';
import { HeatmapOverlayComponent } from './components/heatmap-overlay/heatmap-overlay.component';
import { SegmentationViewerComponent } from './components/segmentation-viewer/segmentation-viewer.component';
import { LesionHistoryComponent } from './components/lesion-history/lesion-history.component';
import { ClinicalFormComponent } from './components/clinical-form/clinical-form.component';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-scan-body',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterModule,
    RiskScoreComponent,
    TriageAdviceComponent,
    HeatmapOverlayComponent,
    SegmentationViewerComponent,
    LesionHistoryComponent,
    ClinicalFormComponent
  ],
  templateUrl: './scan-body.component.html',
  styleUrl: './scan-body.component.scss'
})
export class ScanBodyComponent implements OnDestroy, OnInit {
  // History
  history: HistoryEntry[] = [];
  expandedHistoryId: string | null = null;
  comparisonEntries: string[] = [];

  // Modal states
  showNewAnalysisModal = false;
  showProfileModal = false;
  showClinicalContext = false;
  showResultsModal = false;
  showComparisonModal = false;

  // Workflow state
  currentStep: 'image' | 'profile' | 'clinical' = 'image';
  photo: File | null = null;
  preview: string | null = null;
  showCamera = false;
  isLoading = false;
  isAnalyzingQuality = false;
  errorMessage: string | null = null;
  private mediaStream: MediaStream | null = null;
  
  // Image quality
  imageQuality: ImageQualityMetrics | null = null;
  showQualityWarning = false;
  
  // Results visualization
  showHeatmap = false;
  heatmapOpacity = 50; // 0-100
  showSegmentation = false;
  
  // Loading states
  loadingMessage = 'Analyzing...';
  
  // Risk level helper functions
  getRiskLevelLabel(riskLevel: string): string {
    switch(riskLevel?.toLowerCase()) {
      case 'high': return 'High Risk';
      case 'medium': return 'Medium Risk';
      case 'low': return 'Low Risk';
      default: return 'Unknown';
    }
  }

  getRiskLevelColor(riskLevel: string): string {
    switch(riskLevel?.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  }
  
  // Forms
  patientForm!: FormGroup;
  profileForm!: FormGroup;
  useProfile = false;
  selectedProfile: any = null;

  // Current analysis
  currentAnalysis: HistoryEntry | null = null;
  currentResults: any = null;

  readonly sexOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unknown', label: 'Not specified' }
  ];

  readonly localizationOptions = [
    'abdomen', 'acral', 'back', 'chest', 'ear', 'face', 'foot', 'forearm',
    'hand', 'lower extremity', 'neck', 'scalp', 'trunk', 'upper extremity'
  ];


  // Profiles loaded from API
  profiles: any[] = [];
  loadingProfiles = false;
  isLoggedIn = false;
  
  private apiUrl = `${environment.apiUrl}/api`;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild('dropZone') dropZone!: ElementRef<HTMLDivElement>;

  constructor(
    private http: HttpClient, 
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private historyService: HistoryService,
    private imageQualityService: ImageQualityService
  ) {}

  ngOnInit(): void {
    // Determine auth status
    this.authService.isLoggedIn().subscribe((logged) => {
      this.isLoggedIn = logged;
      if (!logged) {
        this.useProfile = false;
      }
    });

    this.initPatientForm();
    this.initProfileForm();
    this.loadHistory();
    this.loadClinicalOptions();
    this.loadProfiles();
  }

  get patientControls() {
    return this.patientForm.controls;
  }

  private initPatientForm(): void {
    this.patientForm = this.fb.group({
      patientAge: [null, [Validators.required, Validators.min(0), Validators.max(120)]],
      patientSex: [null, Validators.required],
      localization: [null, Validators.required]
    });
  }


  private initProfileForm(): void {
    this.profileForm = this.fb.group({
      profileId: [null],
      useManual: [false]
    });
  }

  // Clinical Options Loading
  loadClinicalOptions(): void {
    this.apiService.getClinicalOptions().subscribe({
      next: (options) => {
        // Update options from API if available
        if (options.sex_options) {
          // Update sex options while keeping French labels
          this.sexOptions.forEach(option => {
            if (!options.sex_options.includes(option.value)) {
              console.warn(`Sex option ${option.value} not supported by API`);
            }
          });
        }
        if (options.location_options) {
          // Update localization options
          this.localizationOptions.splice(0, this.localizationOptions.length, ...options.location_options);
        }
      },
      error: (error) => {
        console.warn('Could not load clinical options from API, using defaults:', error);
      }
    });
  }

  // History Management
  loadHistory(): void {
    this.history = this.historyService.loadHistory();
  }

  private saveHistoryEntry(imagePreview: string, patientData: any, results: any, imageQuality?: ImageQualityMetrics): void {
    const historyEntry: HistoryEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      imagePreview: imagePreview,
      patientData: patientData,
      results: results,
      imageQuality: imageQuality || undefined,
      expanded: false
    };

    this.history = this.historyService.addEntry(historyEntry, this.history);
  }

  // Modal Management
  openNewAnalysisModal(): void {
    this.showNewAnalysisModal = true;
    this.currentStep = 'image';
    this.resetWorkflow();
    document.body.style.overflow = 'hidden';
  }

  closeNewAnalysisModal(): void {
    this.showNewAnalysisModal = false;
    // Ne pas réinitialiser le workflow si on passe à l'étape suivante
    // Le workflow sera réinitialisé seulement si on ferme complètement
    if (this.currentStep === 'image') {
      this.resetWorkflow();
    }
    document.body.style.overflow = '';
  }

  openProfileModal(): void {
    if (!this.photo) {
      this.errorMessage = 'Please select an image first.';
      return;
    }
    this.showProfileModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
    document.body.style.overflow = '';
  }

  openClinicalContext(): void {
    if (this.useProfile && !this.selectedProfile) {
      this.errorMessage = 'Please select a profile.';
      return;
    }
    if (!this.useProfile && this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      this.errorMessage = 'Please fill in the profile information.';
      return;
    }
    this.showProfileModal = false;
    this.showClinicalContext = true;
    this.currentStep = 'clinical';
    
    // Pre-fill form if a profile is selected (already done in selectProfile)
    // No need to do it again here
  }

  closeClinicalContext(): void {
    this.showClinicalContext = false;
    document.body.style.overflow = '';
  }

  openResultsModal(results: any): void {
    this.currentResults = results;
    this.showResultsModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeResultsModal(): void {
    this.showResultsModal = false;
    this.currentResults = null;
    document.body.style.overflow = '';
  }

  // Workflow Reset
  resetWorkflow(): void {
    this.photo = null;
    this.preview = null;
    this.currentStep = 'image';
    this.showCamera = false;
    this.stopCamera();
    this.errorMessage = null;
    this.useProfile = false;
    this.selectedProfile = null;
    this.imageQuality = null;
    this.showQualityWarning = false;
    this.showHeatmap = false;
    this.showSegmentation = false;
    this.patientForm.reset();
    this.profileForm.reset();
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Image Handling
  triggerFileInput(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Please select a valid image file.';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.errorMessage = 'Image size must be less than 10MB.';
      return;
    }

    this.errorMessage = null;
    this.photo = file;
    this.imageQuality = null;
    this.showQualityWarning = false;
    
    // Convert to Data URL for persistence in history
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      this.preview = e.target.result as string;
      
      // Analyze image quality
      await this.analyzeImageQuality(file);
    };
    reader.readAsDataURL(file);
  }
  
  /**
   * Analyze image quality
   */
  async analyzeImageQuality(file: File | Blob): Promise<void> {
    this.isAnalyzingQuality = true;
    try {
      this.imageQuality = await this.imageQualityService.analyzeImageQuality(file);
      
      // Show warning if quality is poor
      if (this.imageQuality.overallQuality === 'poor' || 
          this.imageQuality.isBlurry || 
          this.imageQuality.isTooDark || 
          this.imageQuality.isTooBright) {
        this.showQualityWarning = true;
      }
    } catch (error) {
      console.error('Error analyzing image quality:', error);
    } finally {
      this.isAnalyzingQuality = false;
    }
  }

  // Drag and Drop
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.dropZone) {
      this.dropZone.nativeElement.classList.add('border-green-500', 'bg-green-500/10');
    }
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.dropZone) {
      this.dropZone.nativeElement.classList.remove('border-green-500', 'bg-green-500/10');
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (this.dropZone) {
      this.dropZone.nativeElement.classList.remove('border-green-500', 'bg-green-500/10');
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  // Camera
  capturePhoto(): void {
    this.errorMessage = null;
    this.showCamera = true;
    
    navigator.mediaDevices
      .getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      })
      .then((stream) => {
        this.mediaStream = stream;
        const video = this.videoElement.nativeElement;
        video.srcObject = stream;
        video.play();
      })
      .catch((err) => {
        console.error('Error accessing camera:', err);
        this.errorMessage = 'Unable to access camera. Please check permissions.';
        this.showCamera = false;
      });
  }

  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    if (this.videoElement?.nativeElement) {
      this.videoElement.nativeElement.srcObject = null;
    }
    this.showCamera = false;
  }

  takePhoto(): void {
    if (!this.videoElement?.nativeElement) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.errorMessage = 'Failed to capture image.';
      return;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (blob) {
        this.photo = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
        this.preview = canvas.toDataURL('image/jpeg');
        this.imageQuality = null;
        this.showQualityWarning = false;
        this.stopCamera();
        
        // Analyze image quality
        await this.analyzeImageQuality(blob);
      } else {
        this.errorMessage = 'Failed to capture image.';
      }
    }, 'image/jpeg', 0.95);
  }

  clearImage(): void {
    // Only revoke blob URLs, not Data URLs
    if (this.preview && this.preview.startsWith('blob:')) {
      URL.revokeObjectURL(this.preview);
    }
    this.photo = null;
    this.preview = null;
    this.errorMessage = null;
    
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
  }

  // Continue to Profile Step
  continueToProfile(): void {
    if (!this.photo) {
      this.errorMessage = 'Please select or capture an image first.';
      return;
    }
    // Sauvegarder la photo avant de fermer le modal (car resetWorkflow() la remet à null)
    const savedPhoto = this.photo;
    const savedPreview = this.preview;
    
    this.closeNewAnalysisModal();
    
    // Restaurer la photo après la fermeture
    this.photo = savedPhoto;
    this.preview = savedPreview;
    
    this.openProfileModal();
  }

  // Continue to Clinical Context
  continueToClinical(): void {
    this.openClinicalContext();
  }

  // Load profiles from API (like account component)
  loadProfiles(): void {
    this.loadingProfiles = true;
    
    // Check if token exists
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('⚠️ No access token found in localStorage');
      this.loadingProfiles = false;
      this.profiles = [];
      return;
    }
    
    console.log('🔍 Loading profiles from:', `${this.apiUrl}/profiles`);
    
    this.authService.checkAndRefreshToken().subscribe({
      next: (isValid) => {
        if (isValid) {
          this.http.get<any[]>(`${this.apiUrl}/profiles`, {
            headers: { Authorization: `Bearer ${token}` }
          }).subscribe({
            next: (data) => {
              console.log('✅ Profiles loaded successfully:', data);
              console.log('📊 Number of profiles:', data?.length || 0);
              this.profiles = Array.isArray(data) ? data : [];
              this.loadingProfiles = false;
            },
            error: (error) => {
              console.error('❌ Error loading profiles:', error);
              console.error('Error details:', {
                status: error.status,
                statusText: error.statusText,
                message: error.message,
                error: error.error,
                url: `${this.apiUrl}/profiles`
              });
              this.loadingProfiles = false;
              // Continue with empty profiles array
              this.profiles = [];
            }
          });
        } else {
          console.warn('⚠️ Token validation failed, cannot load profiles');
          this.loadingProfiles = false;
          this.profiles = [];
        }
      },
      error: (error) => {
        console.error('❌ Error in token validation:', error);
        this.loadingProfiles = false;
        this.profiles = [];
      }
    });
  }

  // Profile Selection
  selectProfile(profile: any): void {
    this.selectedProfile = profile;
    this.useProfile = true;
    this.profileForm.patchValue({ profileId: profile.id, useManual: false });
    
    // Calculate age from birth_date if available
    let age = null;
    if (profile.birth_date) {
      const birthDate = new Date(profile.birth_date);
      const today = new Date();
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }
    
    // Pre-fill form with profile data
    this.patientForm.patchValue({
      patientAge: age || profile.age || null,
      patientSex: profile.sex || null
    });
  }
  
  getProfileDisplayName(profile: any): string {
    if (!profile) return '';
    const firstName = profile.first_name || '';
    const lastName = profile.last_name || '';
    return `${firstName} ${lastName}`.trim() || `Profile #${profile.id}`;
  }
  
  // Get risk percentage from results
  getRiskPercentage(results: any): number {
    if (results?.malignant_risk_percentage !== undefined) {
      return results.malignant_risk_percentage;
    }
    // Fallback for old format
    if (results?.confidence !== undefined) {
      return results.confidence * 100;
    }
    return 0;
  }

  getProfileAge(profile: any): number | null {
    if (profile.birth_date) {
      const birthDate = new Date(profile.birth_date);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return profile.age || null;
  }

  useManualData(): void {
    this.useProfile = false;
    this.selectedProfile = null;
    this.profileForm.patchValue({ useManual: true });
  }

  // Submit Analysis
  submitAnalysis(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    if (!this.photo) {
      this.errorMessage = 'Please select an image.';
      return;
    }

    this.isLoading = true;
    this.loadingMessage = 'Analyzing image, this may take a few seconds...';
    this.errorMessage = null;

    const formData = new FormData();
    formData.append('photo', this.photo);
    formData.append('image', this.photo);
    
    const patientData = { ...this.patientForm.value };
    if (this.useProfile && this.selectedProfile) {
      patientData.profileId = this.selectedProfile.id;
      patientData.profileName = this.selectedProfile.name;
    }
    
    Object.entries(patientData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, String(value));
      }
    });

    this.apiService.scanBody(formData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.currentResults = response;
        
        // Reset visualization states
        this.showHeatmap = false;
        this.showSegmentation = false;
        
        // Ensure preview is a Data URL (base64) for persistence
        let imagePreview = this.preview || '';
        
        // If preview is a blob URL, convert it to Data URL
        if (imagePreview && imagePreview.startsWith('blob:')) {
          // Convert blob URL to Data URL
          fetch(imagePreview)
            .then(res => res.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onload = (e: any) => {
                imagePreview = e.target.result as string;
                this.saveHistoryEntry(imagePreview, patientData, response, this.imageQuality || undefined);
              };
              reader.readAsDataURL(blob);
            })
            .catch(() => {
              // Fallback: use empty string if conversion fails
              this.saveHistoryEntry('', patientData, response, this.imageQuality || undefined);
            });
        } else {
          // Already a Data URL or empty, save directly
          this.saveHistoryEntry(imagePreview, patientData, response, this.imageQuality || undefined);
        }
        
        this.closeClinicalContext();
        this.openResultsModal(response);
        this.resetWorkflow();
      },
      error: (error: Error) => {
        this.isLoading = false;
        console.error('Error during upload:', error);
        this.errorMessage = error.message;
      }
    });
  }

  // History Expansion
  toggleHistoryItem(id: string): void {
    if (this.expandedHistoryId === id) {
      this.expandedHistoryId = null;
    } else {
      this.expandedHistoryId = id;
    }
    // Update history item expanded state
    const item = this.history.find(h => h.id === id);
    if (item) {
      item.expanded = this.expandedHistoryId === id;
    }
  }

  viewHistoryResults(item: HistoryEntry): void {
    this.currentResults = item.results;
    this.preview = item.imagePreview;
    this.openResultsModal(item.results);
  }

  deleteHistoryItem(id: string): void {
    this.history = this.historyService.deleteEntry(id, this.history);
    if (this.expandedHistoryId === id) {
      this.expandedHistoryId = null;
    }
  }
  
  /**
   * Handle comparison request
   */
  onCompareEntries(ids: string[]): void {
    this.comparisonEntries = ids;
    this.showComparisonModal = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeComparisonModal(): void {
    this.showComparisonModal = false;
    this.comparisonEntries = [];
    document.body.style.overflow = '';
  }
  
  /**
   * Get comparison data
   */
  getComparisonData(): { entry1: HistoryEntry; entry2: HistoryEntry; comparison: any } | null {
    if (this.comparisonEntries.length !== 2) return null;
    
    const entry1 = this.history.find(h => h.id === this.comparisonEntries[0]);
    const entry2 = this.history.find(h => h.id === this.comparisonEntries[1]);
    
    if (!entry1 || !entry2) return null;
    
    const comparison = this.historyService.compareEntries(entry1, entry2);
    return { entry1, entry2, comparison };
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Cleanup
  ngOnDestroy(): void {
    this.stopCamera();
    // Only revoke blob URLs, not Data URLs
    if (this.preview && this.preview.startsWith('blob:')) {
      URL.revokeObjectURL(this.preview);
    }
  }
}
