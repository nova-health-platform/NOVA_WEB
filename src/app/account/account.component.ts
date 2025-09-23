import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Déclaration pour autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html'
})
export class AccountComponent implements OnInit, OnDestroy {
  /** ✅ Données utilisateur */
  user: any = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    country: '',
    consent_rgpd: false,
    consent_hipaa: false,
    subscription_plan: '',
    subscription_start: '',
    subscription_end: '',
    max_profiles: 1
  };

  profiles: any[] = [];
  history: any[] = [];

  /** ✅ Filtres pour l'historique */
  historyFilters = {
    selectedProfile: 'all', // 'all' ou ID du profil
    dateFrom: '',
    dateTo: ''
  };

  /** ✅ Recherche de profil */
  profileSearch = {
    query: '',
    showDropdown: false,
    filteredProfiles: [] as any[]
  };

  /** ✅ Modal d'analyse */
  showAnalysisModal = false;
  selectedAnalysisData: any = null;
  currentResultView = 'result'; // 'result', 'demographics', 'treatments'
  activeTab = 'general'; // Pour la navigation des treatments
  showGenderChart = false; // Pour afficher le diagramme de genre
  showAgeChart = false; // Pour afficher le diagramme d'âge
  genderData: any = null;
  ageData: any = null;
  
  // Données utilisateur pour la mise en surbrillance
  userAge: number | null = null;
  userSex: string = '';

  /** ✅ Pagination pour l'historique Enterprise */
  historyPagination = {
    currentPage: 1,
    itemsPerPage: 100,
    totalItems: 0
  };

  /** ✅ Nouveau profil avec champs avancés */
  newProfile: any = {
    first_name: '',
    last_name: '',
    birth_date: '',
    sex: '',
    weight: '',
    height: '',
    allergies: [],
    chronic_conditions: [],
    surgeries: [],
    family_history: [],
    vaccinations: [],
    medications: []
  };

  /** ✅ Modals */
  showEditModal = false;
  selectedProfile: any = null;
  isUpdating = false;
  isCreating = false;
  showAddProfileForm = false;

  showResetPasswordModal = false;
  isResetting = false;
  resetData = { old_password: '', new_password: '', confirm_password: '' };

  showEditAccountModal = false;

  /** ✅ Afficher/Masquer les champs avancés */
  showAdvanced = false;          // Pour l'ajout de profil
  showAdvancedFields = false;    // Pour l'édition de profil

  /** ✅ Dynamic Advanced Details */
  selectedDetailType = '';
  visibleDetailSections: string[] = [];
  activeDetailSections: string[] = [];

  /** ✅ Pays */
  countries: any[] = [];
  filteredCountries: any[] = [];
  countrySearch = '';
  showCountryDropdown = false;

  showDeleteModal = false;
  profileToDelete: any = null;

  allergyTypes: any[] = [];
  loadingAllergyTypes = false;

  chronicConditionTypes: any[] = [];
  loadingChronicConditions = false;

  familyRelations: string[] = [];
  familyConditions: string[] = [];

  vaccinationList: string[] = [];

  /** ✅ URL API (centralisée) */
  private apiUrl = 'http://localhost:5000/api';
  private tokenCheckInterval: any;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router, private authService: AuthService) {
    // Enregistrer les composants Chart.js
    Chart.register(...registerables, ChartDataLabels);
  }

  ngOnInit() {
    // Vérifier et rafraîchir le token si nécessaire avant de charger les données
    this.authService.checkAndRefreshToken().subscribe((isValid) => {
      if (isValid) {
        this.loadUser();
        this.loadProfiles();
        this.loadHistory();
        this.loadCountries();
        this.loadAllergyTypes();
        this.loadChronicConditionTypes();
        this.loadFamilyHistoryOptions();
        this.loadVaccinationList();
        
        // Démarrer la vérification périodique du token (toutes les 4 minutes)
        this.startTokenCheck();
      } else {
        console.error('[ACCOUNT] Token validation failed');
        this.router.navigate(['/login']);
      }
    });
  }

  /** ✅ Démarrer la vérification périodique du token */
  private startTokenCheck() {
    this.tokenCheckInterval = setInterval(() => {
      this.authService.checkAndRefreshToken().subscribe((isValid) => {
        if (!isValid) {
          console.error('[ACCOUNT] Token validation failed during periodic check');
          this.router.navigate(['/login']);
        }
      });
    }, 4 * 60 * 1000); // Vérifier toutes les 4 minutes
  }

  /** ✅ Nettoyer les timers */
  ngOnDestroy() {
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    // Détruire les diagrammes
    this.destroyCharts();
    // S'assurer que le scroll est restauré si le composant est détruit
    document.body.style.overflow = 'auto';
  }


  loadVaccinationList() {
    this.http.get<{ vaccines: string[] }>('assets/vaccinations.json').subscribe({
      next: (data) => {
        this.vaccinationList = data.vaccines;
      },
      error: () => console.error('Erreur lors du chargement des vaccins')
    });
  }

  loadFamilyHistoryOptions() {
    this.http.get<any>('assets/family_history.json').subscribe({
      next: (data) => {
        this.familyRelations = data.relations;
        this.familyConditions = data.conditions;
      },
      error: () => console.error('Erreur lors du chargement des options Family History')
    });
  }

  loadChronicConditionTypes() {
    this.loadingChronicConditions = true;
    this.http.get<any[]>('assets/chronic_conditions.json').subscribe({
      next: (data) => {
        this.chronicConditionTypes = data;
        this.loadingChronicConditions = false;
      },
      error: () => {
        console.error('Erreur lors du chargement des conditions chroniques');
        this.loadingChronicConditions = false;
      }
    });
  }

  loadAllergyTypes() {
    this.loadingAllergyTypes = true;
    this.http.get<any[]>('assets/allergies.json').subscribe({
      next: (data) => {
        this.allergyTypes = data;
        this.loadingAllergyTypes = false;
        this.cdr.detectChanges(); // ✅ Force l'UI à se mettre à jour
      },
      error: () => {
        console.error('Erreur lors du chargement des types d’allergies');
        this.loadingAllergyTypes = false;
      }
    });
  }


  /** ✅ Charger la liste des pays */
  loadCountries() {
    this.http.get<any[]>('assets/countries.json').subscribe({
      next: (data) => {
        this.countries = data;
        this.filteredCountries = data;
      },
      error: () => console.error('Erreur lors du chargement des pays')
    });
  }

  filterCountries() {
    const search = this.countrySearch.toLowerCase();
    this.filteredCountries = this.countries.filter((c) =>
      c.name.toLowerCase().includes(search)
    );
    this.showCountryDropdown = true;
  }

  selectCountry(countryName: string) {
    this.user.country = countryName;
    this.countrySearch = countryName;
    this.showCountryDropdown = false;
  }

  closeCountryDropdown() {
    this.showCountryDropdown = false;
  }

  onCountryInputBlur() {
    setTimeout(() => this.closeCountryDropdown(), 150);
  }

  /** ✅ Charger les infos utilisateur */
  loadUser() {
    this.http.get(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => {
      this.user = data;
      // Initialiser le champ de recherche avec le pays actuel
      this.countrySearch = this.user.country || '';
    });
  }

  /** ✅ Charger les profils */
  loadProfiles() {
    this.http.get<any[]>(`${this.apiUrl}/profiles`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => this.profiles = data);
  }

  /** ✅ Charger l'historique */
  loadHistory() {
    // Ne pas charger l'historique pour les utilisateurs FREE
    if (this.user?.subscription_plan === 'free') {
      this.history = [];
      return;
    }
    
    this.http.get<any[]>(`${this.apiUrl}/history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => {
      this.history = data;
      // Forcer la détection de changement pour mettre à jour l'affichage
      this.cdr.detectChanges();
    });
  }

  /** ✅ Vérifier si les champs obligatoires sont remplis */
  isFormValid(): boolean {
    return (
      this.newProfile.first_name.trim() !== '' &&
      this.newProfile.last_name.trim() !== '' &&
      this.newProfile.birth_date.trim() !== '' &&
      this.newProfile.sex.trim() !== ''
    );
  }

  /** ✅ Basculer l'affichage du formulaire d'ajout */
  toggleAddProfileForm() {
    this.showAddProfileForm = !this.showAddProfileForm;
    if (!this.showAddProfileForm) {
      this.showAdvanced = false;
      this.resetNewProfile();
    }
  }

  /** ✅ Créer un profil */
  createProfile() {
    if (!this.isFormValid() || this.profiles.length >= this.user?.max_profiles) return;

    this.isCreating = true;

    this.http.post(`${this.apiUrl}/profiles`, this.newProfile, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: () => {
        this.loadProfiles();
        this.resetNewProfile();
        this.showAdvanced = false;
        this.showAddProfileForm = false;
        this.isCreating = false;
      },
      error: () => {
        this.isCreating = false;
        alert('Failed to create profile.');
      }
    });
  }

  /** ✅ Réinitialiser le formulaire */
  private resetNewProfile() {
    this.newProfile = {
      first_name: '',
      last_name: '',
      birth_date: '',
      sex: '',
      weight: '',
      height: '',
      allergies: [],
      chronic_conditions: [],
      surgeries: [],
      family_history: [],
      vaccinations: [],
      medications: []
    };
  }

  /** ✅ Ajouter un élément dynamique dans le nouveau profil */
  addItemToNewProfile(type: string) {
    const itemMap: any = {
      allergies: { allergy_type: '', other_details: '', substance: '', severity: '' },
      chronic_conditions: { condition_name: '', other_details: '', diagnosed_date: '' },
      surgeries: { surgery_type: '', other_details: '', surgery_date: '' },
      family_history: { relation: '', condition: '', other_condition: '', other_details: '' },
      vaccinations: { vaccine_name: '', other_details: '', vaccination_date: '', dose_number: '' },
      medications: { medication_name: '', other_details: '', dosage: '', frequency: '', frequency_other_details: '' }
    };
    this.newProfile[type].push(itemMap[type]);
  }




  /** ✅ Supprimer un élément dynamique dans le nouveau profil */
  removeItem(type: string, index: number) {
    if (this.newProfile[type]) {
      this.newProfile[type].splice(index, 1);
    }
  }

  /** ✅ Ajouter un élément dans l'édition du profil */
  addItemToSelectedProfile(list: any[], item: any) {
    list.push({ ...item });
  }

  /** ✅ Supprimer un élément dans l'édition du profil */
  removeItemFromSelectedProfile(list: any[], index: number) {
    list.splice(index, 1);
  }

  /** ✅ Toggle détails avancés (Ajout) */
  toggleAdvanced() {
    this.showAdvanced = !this.showAdvanced;
  }

  /** ✅ Toggle détails avancés (Édition) */
  toggleAdvancedFields() {
    this.showAdvancedFields = !this.showAdvancedFields;
    // Reset visible sections when toggling
    if (!this.showAdvancedFields) {
      this.visibleDetailSections = [];
      this.activeDetailSections = [];
      this.selectedDetailType = '';
    }
  }

  /** ✅ Dynamic Advanced Details Management */
  addNewDetail() {
    if (this.selectedDetailType && !this.visibleDetailSections.includes(this.selectedDetailType)) {
      this.visibleDetailSections.push(this.selectedDetailType);
      this.selectedDetailType = ''; // Reset selection
    }
  }

  removeDetailSection(sectionType: string) {
    this.visibleDetailSections = this.visibleDetailSections.filter(section => section !== sectionType);
    this.activeDetailSections = this.activeDetailSections.filter(section => section !== sectionType);
  }

  showDetailSection(sectionType: string): boolean {
    return this.visibleDetailSections.includes(sectionType);
  }

  /** ✅ Toggle Detail Section On/Off */
  toggleDetailSection(sectionType: string) {
    if (this.activeDetailSections.includes(sectionType)) {
      // Désactiver la section
      this.activeDetailSections = this.activeDetailSections.filter(section => section !== sectionType);
      this.visibleDetailSections = this.visibleDetailSections.filter(section => section !== sectionType);
    } else {
      // Activer la section
      this.activeDetailSections.push(sectionType);
      this.visibleDetailSections.push(sectionType);
      
      // Initialiser avec un élément vide si le tableau est vide
      this.initializeSectionData(sectionType);
    }
  }

  /** ✅ Initialiser les données d'une section */
  initializeSectionData(sectionType: string) {
    if (!this.selectedProfile) return;
    
    switch (sectionType) {
      case 'allergies':
        if (!this.selectedProfile.allergies || this.selectedProfile.allergies.length === 0) {
          this.selectedProfile.allergies = [{allergy_type: '', substance: '', severity: ''}];
        }
        break;
      case 'medications':
        if (!this.selectedProfile.medications || this.selectedProfile.medications.length === 0) {
          this.selectedProfile.medications = [{medication_name: '', dosage_value: '', dosage_unit: 'mg', frequency: '', frequency_hours: '', other_details: ''}];
        }
        break;
      case 'chronic_conditions':
        if (!this.selectedProfile.chronic_conditions || this.selectedProfile.chronic_conditions.length === 0) {
          this.selectedProfile.chronic_conditions = [{condition_name: '', diagnosed_date: ''}];
        }
        break;
      case 'surgeries':
        if (!this.selectedProfile.surgeries || this.selectedProfile.surgeries.length === 0) {
          this.selectedProfile.surgeries = [{surgery_type: '', surgery_date: '', other_details: ''}];
        }
        break;
      case 'family_history':
        if (!this.selectedProfile.family_history || this.selectedProfile.family_history.length === 0) {
          this.selectedProfile.family_history = [{relation: '', condition: '', other_condition: '', other_details: ''}];
        }
        break;
      case 'vaccinations':
        if (!this.selectedProfile.vaccinations || this.selectedProfile.vaccinations.length === 0) {
          this.selectedProfile.vaccinations = [{vaccine_name: '', vaccination_date: '', dose_number: '', notes: ''}];
        }
        break;
    }
  }

  isDetailSectionActive(sectionType: string): boolean {
    return this.activeDetailSections.includes(sectionType);
  }

  /** ✅ Supprimer un profil */
  deleteProfile(id: number) {
    this.http.delete(`${this.apiUrl}/profiles/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe(() => this.loadProfiles());
  }

  /** ✅ Modal Edit Profile */
  editProfile(profile: any) {
    this.selectedProfile = {
      ...profile,
      allergies: profile.allergies || [],
      chronic_conditions: profile.chronic_conditions || [],
      surgeries: profile.surgeries || [],
      family_history: profile.family_history || [],
      vaccinations: profile.vaccinations || [],
      medications: profile.medications || []
    };

    if (this.selectedProfile.birth_date) {
      this.selectedProfile.birth_date = this.formatDateForInput(this.selectedProfile.birth_date);
    }

    this.showEditModal = true;
    this.lockScroll();
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedProfile = null;
    this.unlockScroll();
  }

  formatDateForInput(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  updateProfile() {
    if (!this.selectedProfile) return;
    this.isUpdating = true;

    this.http.put(`${this.apiUrl}/profiles/${this.selectedProfile.id}`, this.selectedProfile, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: () => {
        this.loadProfiles();
        this.closeEditModal();
        this.isUpdating = false;
      },
      error: () => {
        this.isUpdating = false;
        alert('Failed to update profile.');
      }
    });
  }

  /** ✅ Modal Edit Account */
  openEditAccountModal() {
    this.showEditAccountModal = true;
    this.lockScroll();
  }

  closeEditAccountModal() {
    this.showEditAccountModal = false;
    this.unlockScroll();
  }

  updateAccount() {
    this.http.put(`${this.apiUrl}/me`, this.user, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: () => {
        alert('Account updated successfully!');
        this.loadUser();
        this.closeEditAccountModal();
      },
      error: () => alert('Failed to update account.')
    });
  }

  /** ✅ Modal Reset Password */
  openResetPasswordModal() {
    this.showResetPasswordModal = true;
    this.lockScroll();
  }

  closeResetPasswordModal() {
    this.showResetPasswordModal = false;
    this.resetData = { old_password: '', new_password: '', confirm_password: '' };
    this.unlockScroll();
  }

  resetPassword() {
    if (this.resetData.new_password !== this.resetData.confirm_password) {
      alert('Passwords do not match!');
      return;
    }

    this.isResetting = true;

    this.http.post(`${this.apiUrl}/reset-password`, this.resetData, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: () => {
        this.isResetting = false;
        alert('Password updated successfully!');
        this.closeResetPasswordModal();
      },
      error: () => {
        this.isResetting = false;
        alert('Failed to update password.');
      }
    });
  }

  /** ✅ Ouvrir le modal */
  openDeleteModal(profile: any) {
    this.profileToDelete = profile;
    this.showDeleteModal = true;
    this.lockScroll();
  }

  /** ✅ Fermer le modal */
  closeDeleteModal() {
    this.profileToDelete = null;
    this.showDeleteModal = false;
    this.unlockScroll();
  }

  /** ✅ Confirmer la suppression */
  confirmDeleteProfile() {
    if (!this.profileToDelete) return;

    this.http.delete(`${this.apiUrl}/profiles/${this.profileToDelete.id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: () => {
        this.loadProfiles();
        this.closeDeleteModal();
      },
      error: () => alert('Failed to delete profile.')
    });
  }

  /** ✅ Scroll control */
  private lockScroll() {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }

  private unlockScroll() {
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  /** ✅ Navigation vers la page subscription */
  goToSubscription() {
    this.router.navigate(['/subscription']);
  }

  /** ✅ Méthodes pour les statistiques d'analyses */
  getUsedAnalyses(): number {
    return this.history?.length || 0;
  }

  getMaxAnalyses(): number {
    if (this.user?.subscription_plan === 'enterprise') {
      return 999; // Illimité
    } else if (this.user?.subscription_plan === 'premium') {
      return 999; // Illimité avec profil, 5 sans profil
    } else {
      return 1; // Plan gratuit
    }
  }

  getUsagePercentage(): number {
    const used = this.getUsedAnalyses();
    const max = this.getMaxAnalyses();
    
    if (max === 999) {
      return 100; // Barre pleine pour les plans illimités
    }
    
    // Pour les plans limités, retourner au moins 10% pour que la barre soit visible
    const percentage = (used / max) * 100;
    return Math.max(percentage, 10);
  }

  /** ✅ Récupérer le nom du profil basé sur l'ID */
  getProfileName(profileId: number): string {
    const profile = this.profiles.find(p => p.id === profileId);
    if (profile) {
      return `${profile.first_name} ${profile.last_name}`.trim();
    }
    return `Profile #${profileId}`;
  }

  /** ✅ Filtrer l'historique selon les critères sélectionnés et le plan */
  getFilteredHistory(): any[] {
    let filtered = [...this.history];

    // Filtrer par profil
    if (this.historyFilters.selectedProfile !== 'all') {
      const profileId = parseInt(this.historyFilters.selectedProfile);
      filtered = filtered.filter(h => h.profile_id === profileId);
    }

    // Filtrer par date
    if (this.historyFilters.dateFrom) {
      const fromDate = new Date(this.historyFilters.dateFrom);
      filtered = filtered.filter(h => new Date(h.created_at) >= fromDate);
    }

    if (this.historyFilters.dateTo) {
      const toDate = new Date(this.historyFilters.dateTo);
      toDate.setHours(23, 59, 59, 999); // Fin de journée
      filtered = filtered.filter(h => new Date(h.created_at) <= toDate);
    }

    // Limiter selon le plan
    if (this.user?.subscription_plan === 'premium') {
      // Premium : 50 derniers seulement
      filtered = filtered.slice(0, 50);
    } else if (this.user?.subscription_plan === 'enterprise') {
      // Enterprise : Pagination
      const startIndex = (this.historyPagination.currentPage - 1) * this.historyPagination.itemsPerPage;
      const endIndex = startIndex + this.historyPagination.itemsPerPage;
      filtered = filtered.slice(startIndex, endIndex);
    }

    return filtered;
  }

  /** ✅ Réinitialiser les filtres */
  resetHistoryFilters(): void {
    this.historyFilters = {
      selectedProfile: 'all',
      dateFrom: '',
      dateTo: ''
    };
  }

  /** ✅ Méthodes de pagination pour Enterprise */
  getTotalPages(): number {
    if (this.user?.subscription_plan !== 'enterprise') return 1;
    return Math.ceil(this.history.length / this.historyPagination.itemsPerPage);
  }

  goToPage(page: number): void {
    if (this.user?.subscription_plan !== 'enterprise') return;
    const totalPages = this.getTotalPages();
    if (page >= 1 && page <= totalPages) {
      this.historyPagination.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    if (this.user?.subscription_plan !== 'enterprise') return [];
    const totalPages = this.getTotalPages();
    const currentPage = this.historyPagination.currentPage;
    const pages: number[] = [];
    
    // Afficher max 5 pages autour de la page courante
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /** ✅ Vérifier si l'historique est disponible selon le plan */
  isHistoryAvailable(): boolean {
    return this.user?.subscription_plan !== 'free';
  }

  /** ✅ Obtenir le message d'information selon le plan */
  getHistoryInfoMessage(): string {
    if (this.user?.subscription_plan === 'premium') {
      return 'Showing your 50 most recent analyses';
    } else if (this.user?.subscription_plan === 'enterprise') {
      return `Showing ${this.getFilteredHistory().length} of ${this.history.length} analyses`;
    }
    return '';
  }

  /** ✅ Obtenir le texte de l'historique selon le plan */
  getHistoryText(): string {
    if (this.user?.subscription_plan === 'free') {
      return 'No';
    } else if (this.user?.subscription_plan === 'premium') {
      return 'Last 50 analysis';
    } else if (this.user?.subscription_plan === 'enterprise') {
      return 'Unlimited';
    }
    return 'No';
  }

  /** ✅ Méthodes pour la recherche de profil */
  onProfileSearchInput(): void {
    if (this.profileSearch.query.length === 0) {
      this.profileSearch.filteredProfiles = [];
      this.profileSearch.showDropdown = false;
      this.historyFilters.selectedProfile = 'all';
      return;
    }

    this.profileSearch.filteredProfiles = this.profiles.filter(profile => {
      const fullName = `${profile.first_name} ${profile.last_name}`.toLowerCase();
      return fullName.includes(this.profileSearch.query.toLowerCase());
    });

    this.profileSearch.showDropdown = this.profileSearch.filteredProfiles.length > 0;
  }

  selectProfile(profile: any): void {
    this.historyFilters.selectedProfile = profile.id.toString();
    this.profileSearch.query = `${profile.first_name} ${profile.last_name}`;
    this.profileSearch.showDropdown = false;
  }

  clearProfileSearch(): void {
    this.profileSearch.query = '';
    this.profileSearch.showDropdown = false;
    this.historyFilters.selectedProfile = 'all';
  }

  getSelectedProfileName(): string {
    if (this.historyFilters.selectedProfile === 'all') {
      return 'All Profiles';
    }
    const profile = this.profiles.find(p => p.id.toString() === this.historyFilters.selectedProfile);
    return profile ? `${profile.first_name} ${profile.last_name}` : 'All Profiles';
  }

  /** ✅ Gérer le blur avec délai */
  onProfileSearchBlur(): void {
    setTimeout(() => {
      this.profileSearch.showDropdown = false;
    }, 200);
  }

  /** ✅ Modal d'analyse */
  openAnalysisModal(analysisData: any): void {
    this.selectedAnalysisData = analysisData;
    this.showAnalysisModal = true;
    // Empêcher le scroll de la page en arrière-plan
    document.body.style.overflow = 'hidden';
    
    // Analyser les données démographiques
    this.analyzeDemographicsData();
    
    // Extraire les données utilisateur pour la mise en surbrillance
    this.extractUserDataForHighlighting();
  }

  closeAnalysisModal(): void {
    this.showAnalysisModal = false;
    this.selectedAnalysisData = null;
    this.currentResultView = 'result'; // Reset to default view
    this.activeTab = 'general'; // Reset active tab
    // Reset demographics flags
    this.showGenderChart = false;
    this.showAgeChart = false;
    this.genderData = null;
    this.ageData = null;
    // Reset user data
    this.userAge = null;
    this.userSex = '';
    // Détruire les diagrammes
    this.destroyCharts();
    // Restaurer le scroll de la page
    document.body.style.overflow = 'auto';
  }

  /** ✅ Navigation des onglets */
  setResultView(view: string): void {
    this.currentResultView = view;
    if (view === 'demographics') {
      // Initialiser les diagrammes après un délai pour s'assurer que le DOM est prêt
      setTimeout(() => {
        this.initializeCharts();
      }, 100);
    }
  }

  /** ✅ Analyse des données démographiques */
  analyzeDemographicsData(): void {
    if (this.selectedAnalysisData?.disease_info?.demographics) {
      const demographics = this.parseDemographics(this.selectedAnalysisData.disease_info.demographics);
      this.genderData = demographics.genderData;
      this.ageData = demographics.ageData;
      this.showGenderChart = demographics.isGenderDataValid;
      this.showAgeChart = demographics.isAgeDataValid;
      
    } else {
      this.showGenderChart = false;
      this.showAgeChart = false;
    }
  }

  /** ✅ Extraire les données utilisateur pour la mise en surbrillance */
  extractUserDataForHighlighting(): void {
    console.log('🔍 Full selectedAnalysisData structure:', this.selectedAnalysisData);
    
    // Extraire l'âge et le sexe depuis les données d'analyse
    // Essayer différentes sources possibles
    this.userAge = null;
    this.userSex = '';
    
    // Source 1: profile_data
    if (this.selectedAnalysisData?.profile_data) {
      this.userAge = this.selectedAnalysisData.profile_data.age || null;
      this.userSex = this.selectedAnalysisData.profile_data.sex || '';
      console.log('📊 Found in profile_data:', { age: this.userAge, sex: this.userSex });
    }
    
    // Source 2: user_data
    if ((!this.userAge || !this.userSex) && this.selectedAnalysisData?.user_data) {
      this.userAge = this.userAge || this.selectedAnalysisData.user_data.age || null;
      this.userSex = this.userSex || this.selectedAnalysisData.user_data.sex || '';
      console.log('📊 Found in user_data:', { age: this.userAge, sex: this.userSex });
    }
    
    // Source 3: Données directes
    if ((!this.userAge || !this.userSex)) {
      this.userAge = this.userAge || this.selectedAnalysisData?.age || null;
      this.userSex = this.userSex || this.selectedAnalysisData?.sex || '';
      console.log('📊 Found in direct data:', { age: this.userAge, sex: this.userSex });
    }
    
    // Source 4: Dans les données d'analyse (si stockées différemment)
    if ((!this.userAge || !this.userSex) && this.selectedAnalysisData?.analysis_data) {
      this.userAge = this.userAge || this.selectedAnalysisData.analysis_data.age || null;
      this.userSex = this.userSex || this.selectedAnalysisData.analysis_data.sex || '';
      console.log('📊 Found in analysis_data:', { age: this.userAge, sex: this.userSex });
    }
    
    // ✅ Source 5: Chercher dans les profils existants par ID de profil
    if ((!this.userAge || !this.userSex) && this.selectedAnalysisData?.profile_id) {
      const profileId = this.selectedAnalysisData.profile_id;
      const matchingProfile = this.profiles.find(profile => profile.id === profileId);
      if (matchingProfile) {
        this.userAge = this.userAge || matchingProfile.age || null;
        this.userSex = this.userSex || matchingProfile.sex || '';
        console.log('📊 Found in profiles by ID:', { 
          profileId: profileId, 
          age: this.userAge, 
          sex: this.userSex,
          profile: matchingProfile 
        });
      }
    }
    
    // ✅ Source 6: Chercher dans tous les profils si pas d'ID spécifique
    if ((!this.userAge || !this.userSex) && this.profiles.length > 0) {
      // Prendre le premier profil disponible (fallback)
      const firstProfile = this.profiles[0];
      this.userAge = this.userAge || firstProfile.age || null;
      this.userSex = this.userSex || firstProfile.sex || '';
      console.log('📊 Found in first available profile:', { 
        age: this.userAge, 
        sex: this.userSex,
        profile: firstProfile 
      });
    }
    
    // ✅ Calculer l'âge au moment de l'analyse si on a la date de naissance
    this.calculateAgeAtAnalysisTime();
    
    console.log('✅ Final user data for highlighting:', {
      userAge: this.userAge,
      userSex: this.userSex,
      hasAge: this.userAge !== null,
      hasSex: this.userSex !== ''
    });
  }

  /** ✅ Calculer l'âge au moment de l'analyse */
  calculateAgeAtAnalysisTime(): void {
    let birthDate = null;
    
    // Chercher la date de naissance dans différentes sources
    if (this.selectedAnalysisData?.profile_data?.birth_date) {
      birthDate = this.selectedAnalysisData.profile_data.birth_date;
    } else if (this.selectedAnalysisData?.user_data?.birth_date) {
      birthDate = this.selectedAnalysisData.user_data.birth_date;
    } else if (this.selectedAnalysisData?.birth_date) {
      birthDate = this.selectedAnalysisData.birth_date;
    } else if (this.selectedAnalysisData?.profile_id) {
      // Chercher dans les profils par ID
      const profileId = this.selectedAnalysisData.profile_id;
      const matchingProfile = this.profiles.find(profile => profile.id === profileId);
      if (matchingProfile?.birth_date) {
        birthDate = matchingProfile.birth_date;
      }
    } else if (this.profiles.length > 0) {
      // Chercher dans le premier profil disponible
      const firstProfile = this.profiles[0];
      if (firstProfile?.birth_date) {
        birthDate = firstProfile.birth_date;
      }
    }
    
    if (birthDate) {
      // Utiliser la date de l'analyse pour calculer l'âge
      const analysisDate = this.selectedAnalysisData?.created_at || this.selectedAnalysisData?.analysis_date || new Date().toISOString();
      const calculatedAge = this.calculateAgeFromBirthDate(birthDate, analysisDate);
      
      // Toujours utiliser l'âge calculé depuis la date de naissance pour être précis
      this.userAge = calculatedAge;
      
      console.log('📅 Calculated age from birth date:', {
        birthDate: birthDate,
        analysisDate: analysisDate,
        calculatedAge: calculatedAge,
        previousAge: this.userAge
      });
    } else {
      console.log('⚠️ No birth date found, using stored age:', this.userAge);
    }
  }

  /** ✅ Calculer l'âge entre deux dates */
  calculateAgeFromBirthDate(birthDate: string, analysisDate: string): number {
    const birth = new Date(birthDate);
    const analysis = new Date(analysisDate);
    
    let age = analysis.getFullYear() - birth.getFullYear();
    const monthDiff = analysis.getMonth() - birth.getMonth();
    
    // Si le mois de naissance n'est pas encore arrivé cette année
    if (monthDiff < 0 || (monthDiff === 0 && analysis.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /** ✅ Parse les données démographiques (identique à analysis.component.ts) */
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

  /** ✅ Initialisation des diagrammes */
  initializeCharts(): void {
    
    // Détruire les diagrammes existants
    this.destroyCharts();
    
    // Créer le diagramme de genre
    if (this.showGenderChart && this.genderData) {
      this.createGenderChart();
    }
    
    // Créer le diagramme d'âge
    if (this.showAgeChart && this.ageData) {
      this.createAgeChart();
    }
  }

  /** ✅ Créer le diagramme de genre (identique à analysis.component.ts) */
  createGenderChart(): void {
    const canvas = document.getElementById('modalGenderChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let highlightIndexGender = -1;
    if (this.userSex) {
      highlightIndexGender = this.genderData.labels.findIndex((label: string) =>
        label.toLowerCase() === this.userSex.toLowerCase()
      );
    console.log('🎯 Gender highlighting:', {
      userSex: this.userSex,
      genderLabels: this.genderData.labels,
      highlightIndexGender: highlightIndexGender,
      genderValues: this.genderData.values
    });
    } else {
      console.log('⚠️ No user sex data for gender highlighting');
    }

    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.genderData.labels,
        datasets: [{
          data: this.genderData.values,
          backgroundColor: this.genderData.values.map((_: number, i: number) => {
            const color = i === highlightIndexGender ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)';
            console.log(`🎨 Gender color for index ${i}: ${color} (highlight: ${i === highlightIndexGender})`);
            return color;
          }),
          borderColor: this.genderData.values.map((_: number, i: number) =>
            'transparent' // Pas de bordure
          ),
          borderWidth: this.genderData.values.map((_: number, i: number) =>
            0 // Pas de bordure
          ),
          hoverOffset: 6,
          spacing: 0.5, // Espace réduit entre les sections
          offset: this.genderData.values.map((_: number, i: number) => 
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

  /** ✅ Créer le diagramme d'âge (identique à analysis.component.ts) */
  createAgeChart(): void {
    const canvas = document.getElementById('modalAgeChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const allAgeLabels = [
      '0-5', '6-10', '11-15', '16-20', '21-25', '26-30',
      '31-35', '36-40', '41-45', '46-50', '51-55',
      '56-60', '61-65', '65+'
    ];

    // Filtrer les labels et données pour enlever les plages avec 0%
    const filteredData = [];
    const filteredLabels = [];
    const originalToFilteredIndex = [];
    
    for (let i = 0; i < this.ageData.values.length; i++) {
      if (this.ageData.values[i] > 0) {
        filteredData.push(this.ageData.values[i]);
        filteredLabels.push(allAgeLabels[i]);
        originalToFilteredIndex[i] = filteredData.length - 1;
      } else {
        originalToFilteredIndex[i] = -1; // Marquer comme supprimé
      }
    }

    let highlightIndex = -1;
    if (this.userAge !== null) {
      const userAge = this.userAge;
      for (let i = 0; i < allAgeLabels.length; i++) {
        const label = allAgeLabels[i];
        if (this.ageData.values[i] > 0) { // Seulement si cette plage a des données
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
      console.log('🎯 Age highlighting:', {
        userAge: this.userAge,
        allAgeLabels: allAgeLabels,
        ageDataValues: this.ageData.values,
        highlightIndex: highlightIndex,
        filteredLabels: filteredLabels
      });
    } else {
      console.log('⚠️ No user age data for age highlighting');
    }

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: filteredLabels,
        datasets: [{
          label: 'Age Distribution (%)',
          data: filteredData,
          backgroundColor: filteredData.map((_: number, i: number) => {
            const color = i === highlightIndex ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)';
            console.log(`🎨 Age color for index ${i}: ${color} (highlight: ${i === highlightIndex})`);
            return color;
          }),
          borderColor: filteredData.map((_: number, i: number) =>
            'transparent' // Pas de bordure
          ),
          borderWidth: filteredData.map((_: number, i: number) =>
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

  /** ✅ Détruire les diagrammes existants */
  destroyCharts(): void {
    Chart.getChart('modalGenderChart')?.destroy();
    Chart.getChart('modalAgeChart')?.destroy();
  }

  /** ✅ Vérifications pour les treatments */
  get hasDiseaseTreatment(): boolean {
    return this.selectedAnalysisData?.treatment?.disease_treatment != null;
  }

  get hasSymptomTreatments(): boolean {
    return this.selectedAnalysisData?.treatment?.symptom_treatments != null;
  }

  getSymptomList(symptomTreatments: any): string[] {
    return symptomTreatments ? Object.keys(symptomTreatments) : [];
  }

  /** ✅ Vérifications pour les données de symptômes */
  hasSymptomMedicationsData(symptomData: any): boolean {
    if (!symptomData) return false;
    return !!(symptomData.otc_medications || symptomData.prescription_medications || symptomData.alternative || symptomData.treatment_type);
  }

  hasSymptomPosologyData(symptomData: any): boolean {
    if (!symptomData) return false;
    return !!(symptomData.dosage || symptomData.frequency || symptomData.recommended_duration || symptomData.administration_route);
  }

  hasSymptomPrecautionsData(symptomData: any): boolean {
    if (!symptomData) return false;
    return !!(symptomData.precautions || symptomData.contraindications || symptomData.side_effects);
  }

  hasSymptomNotesData(symptomData: any): boolean {
    if (!symptomData) return false;
    return !!(symptomData.notes || symptomData.additional_info);
  }

  getSymptomContainerClasses(symptomData: any, type: string): string {
    const baseClasses = "bg-white/5 border border-white/10 rounded-xl p-4";
    return baseClasses;
  }

  /** ✅ Téléchargement d'analyse */
  downloadAnalysis(analysisData: any, createdAt: string): void {
    const dataStr = JSON.stringify(analysisData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `nova-analysis-${createdAt}-${analysisData.predicted_disease || 'unknown'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }


  /** ✅ Méthodes utilitaires pour l'affichage (copiées de analysis.component.ts) */
  formatDiseaseLabel(disease: string): string {
    if (!disease) return '';
    return disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getGradientColor(confidence: number): string {
    if (confidence >= 80) return '#22c55e'; // green-500
    if (confidence >= 60) return '#eab308'; // yellow-500
    if (confidence >= 40) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  }

  getSeverityColor(severity: string): string {
    if (!severity) return '#6b7280';
    const s = severity.toLowerCase();
    if (s.includes('mild') || s.includes('low')) return '#22c55e';
    if (s.includes('moderate') || s.includes('medium')) return '#eab308';
    if (s.includes('severe') || s.includes('high')) return '#ef4444';
    return '#6b7280';
  }

  getContagiousColor(contagious: string): string {
    if (!contagious) return '#6b7280';
    const c = contagious.toLowerCase();
    if (c.includes('no') || c.includes('non')) return '#22c55e';
    if (c.includes('yes') || c.includes('high')) return '#ef4444';
    if (c.includes('low') || c.includes('moderate')) return '#eab308';
    return '#6b7280';
  }

  getCourseColor(course: string): string {
    if (!course) return '#6b7280';
    const c = course.toLowerCase();
    if (c.includes('acute')) return '#3b82f6';
    if (c.includes('chronic')) return '#8b5cf6';
    return '#6b7280';
  }

  // Method to get confidence description
  getConfidenceDescription(confidence: number): string {
    if (confidence >= 80) return 'High';
    if (confidence >= 60) return 'Medium';
    if (confidence >= 40) return 'Low';
    return 'Very Low';
  }

  // Method to download PDF (copied from analysis.component.ts)
  downloadResultPDF(historyItem: any): void {
    try {
      console.log('Starting PDF generation...');
      console.log('Full historyItem structure:', JSON.stringify(historyItem, null, 2));
      
      // Extract analysis data from history item
      const analysisData = historyItem.analysis_data || historyItem;
      console.log('Extracted analysisData:', JSON.stringify(analysisData, null, 2));
      
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
    
    // Get patient data from analysisData - try multiple sources
    let patientAge = 'Not specified';
    let patientGender = 'Not specified';
    let patientName = 'Not specified';

    console.log('Searching for patient data in historyItem...');
    console.log('historyItem.profile_data:', historyItem.profile_data);
    console.log('historyItem.user_data:', historyItem.user_data);
    console.log('historyItem.age:', historyItem.age);
    console.log('historyItem.sex:', historyItem.sex);
    console.log('historyItem.first_name:', historyItem.first_name);
    console.log('historyItem.last_name:', historyItem.last_name);
    console.log('historyItem.profile_id:', historyItem.profile_id);

    // Try to get data from historyItem first (most likely location)
    if (historyItem.profile_data) {
      console.log('Found profile_data in historyItem, extracting...');
      patientAge = historyItem.profile_data.age ? `${historyItem.profile_data.age} years` : 'Not specified';
      patientGender = historyItem.profile_data.sex || 'Not specified';
      const firstName = historyItem.profile_data.first_name || '';
      const lastName = historyItem.profile_data.last_name || '';
      patientName = `${firstName} ${lastName}`.trim() || 'Not specified';
      console.log('From historyItem.profile_data:', { patientName, patientAge, patientGender });
    }
    
    // Try to get data from analysisData.profile_data
    if (patientName === 'Not specified' && analysisData.profile_data) {
      console.log('Found profile_data in analysisData, extracting...');
      patientAge = analysisData.profile_data.age ? `${analysisData.profile_data.age} years` : 'Not specified';
      patientGender = analysisData.profile_data.sex || 'Not specified';
      const firstName = analysisData.profile_data.first_name || '';
      const lastName = analysisData.profile_data.last_name || '';
      patientName = `${firstName} ${lastName}`.trim() || 'Not specified';
      console.log('From analysisData.profile_data:', { patientName, patientAge, patientGender });
    }
    
    // Fallback to user_data if profile_data is not available
    if (patientName === 'Not specified' && analysisData.user_data) {
      console.log('Found user_data, extracting...');
      patientAge = analysisData.user_data.age ? `${analysisData.user_data.age} years` : 'Not specified';
      patientGender = analysisData.user_data.sex || 'Not specified';
      const firstName = analysisData.user_data.first_name || '';
      const lastName = analysisData.user_data.last_name || '';
      patientName = `${firstName} ${lastName}`.trim() || 'Not specified';
      console.log('From user_data:', { patientName, patientAge, patientGender });
    }
    
    // Fallback to direct properties from historyItem
    if (patientName === 'Not specified') {
      console.log('Using direct properties from historyItem...');
      patientAge = historyItem.age ? `${historyItem.age} years` : 'Not specified';
      patientGender = historyItem.sex || 'Not specified';
      const firstName = historyItem.first_name || '';
      const lastName = historyItem.last_name || '';
      patientName = `${firstName} ${lastName}`.trim() || 'Not specified';
      console.log('From historyItem direct properties:', { patientName, patientAge, patientGender });
    }
    
    // Fallback to direct properties from analysisData
    if (patientName === 'Not specified') {
      console.log('Using direct properties from analysisData...');
      patientAge = analysisData.age ? `${analysisData.age} years` : 'Not specified';
      patientGender = analysisData.sex || 'Not specified';
      const firstName = analysisData.first_name || '';
      const lastName = analysisData.last_name || '';
      patientName = `${firstName} ${lastName}`.trim() || 'Not specified';
      console.log('From analysisData direct properties:', { patientName, patientAge, patientGender });
    }

    // Try to find patient data in nested structures
    if (patientName === 'Not specified') {
      console.log('Searching in nested structures...');
      
      // Check if there's a patient object
      if (analysisData.patient) {
        console.log('Found patient object:', analysisData.patient);
        patientAge = analysisData.patient.age ? `${analysisData.patient.age} years` : 'Not specified';
        patientGender = analysisData.patient.sex || 'Not specified';
        const firstName = analysisData.patient.first_name || '';
        const lastName = analysisData.patient.last_name || '';
        patientName = `${firstName} ${lastName}`.trim() || 'Not specified';
      }
      
      // Check if there's a user object
      if (patientName === 'Not specified' && analysisData.user) {
        console.log('Found user object:', analysisData.user);
        patientAge = analysisData.user.age ? `${analysisData.user.age} years` : 'Not specified';
        patientGender = analysisData.user.sex || 'Not specified';
        const firstName = analysisData.user.first_name || '';
        const lastName = analysisData.user.last_name || '';
        patientName = `${firstName} ${lastName}`.trim() || 'Not specified';
      }
    }

    console.log('Final patient data extracted:', { patientName, patientAge, patientGender });
    
    // Patient info in a clean layout
    doc.setFontSize(11);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(`Name: ${patientName}`, 20, currentY);
    doc.text(`Age: ${patientAge}`, 20, currentY + 8);
    doc.text(`Gender: ${patientGender}`, 20, currentY + 16);

    /** ✅ Diagnostic Result Card */
    currentY += 30;
    this.addCardHeader(doc, 'Diagnostic Result', currentY, colors);
    currentY += 12;
    
    const disease = this.formatDiseaseName(analysisData.predicted_disease) || 'Unknown';
    const confidence = analysisData.confidence ? `${(analysisData.confidence * 100).toFixed(1)}%` : 'Unknown';
    
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
    
    const severity = analysisData.disease_info?.severity_level || 'Unknown';
    const contagious = analysisData.disease_info?.contagious || 'Unknown';
    const course = analysisData.disease_info?.chronic_or_acute || 'Unknown';
    
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
    currentY = this.pdfEnsureSpace(doc, currentY, 20, pageHeight);
    this.addCardHeader(doc, 'Disease Description', currentY, colors);
    currentY += 12;
    
    const description = analysisData.disease_info?.description || 'No description available';
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont('helvetica', 'normal');
    currentY = this.addContentWithPagination(doc, description, currentY, pageHeight);

    /** ✅ Recommended Actions */
    currentY += 10;
    currentY = this.pdfEnsureSpace(doc, currentY, 20, pageHeight);
    this.addCardHeader(doc, 'Recommended Actions', currentY, colors);
    currentY += 12;
    
    const advice = analysisData.disease_info?.advice || 'No specific advice provided';
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    currentY = this.addContentWithPagination(doc, advice, currentY, pageHeight);

    /** ✅ Treatment Information */
    currentY += 15;
    
    // Add some test content to force pagination
    const testContent = "This is a test content to demonstrate automatic pagination. " +
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. " +
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. " +
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. " +
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. " +
      "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, " +
      "eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. " +
      "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos " +
      "qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, " +
      "adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem. " +
      "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur? " +
      "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?";
    
    currentY = this.pdfEnsureSpace(doc, currentY, 20, pageHeight);
    this.addCardHeader(doc, 'Additional Information', currentY, colors);
    currentY += 12;
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    currentY = this.addContentWithPagination(doc, testContent, currentY, pageHeight);
    
    // General Treatment
    const treatment = analysisData.treatment?.disease_treatment || {};
    if (Object.keys(treatment).length > 0) {
      currentY = this.pdfEnsureSpace(doc, currentY, 30, pageHeight);
      this.addCardHeader(doc, 'General Treatment Plan', currentY, colors);
      currentY += 12;
      
      // Check if autoTable is available
      if (typeof (doc as any).autoTable === 'function') {
        doc.autoTable({
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
      } else {
        // Fallback: simple text display
        doc.setFontSize(10);
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        
        const treatmentData = this.formatTreatmentData(treatment);
        treatmentData.forEach(([label, value]) => {
          doc.text(`${label}: ${value}`, 20, currentY);
          currentY += 8;
        });
        currentY += 10;
      }
    }

    /** ✅ Symptom-specific Treatments */
    if (analysisData.treatment?.symptom_treatments) {
      const symptoms = Object.keys(analysisData.treatment.symptom_treatments || {});
      
      symptoms.forEach((symptom) => {
        const sympData = analysisData.treatment?.symptom_treatments?.[symptom] || {};
        
        if (Object.keys(sympData).length > 0) {
          currentY = this.pdfEnsureSpace(doc, currentY, 30, pageHeight);
          this.addCardHeader(doc, `Treatment for ${this.formatSymptom(symptom)}`, currentY, colors);
          currentY += 12;
          
          // Check if autoTable is available
          if (typeof (doc as any).autoTable === 'function') {
            doc.autoTable({
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
          } else {
            // Fallback: simple text display
            doc.setFontSize(10);
            doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
            
            const treatmentData = this.formatTreatmentData(sympData);
            treatmentData.forEach(([label, value]) => {
              doc.text(`${label}: ${value}`, 20, currentY);
              currentY += 8;
            });
            currentY += 10;
          }
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
    console.log('PDF generated successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert('Erreur lors de la génération du PDF: ' + errorMessage);
    }
  }

  // Ensure there is enough space on the current page, otherwise add a new page
  private pdfEnsureSpace(doc: any, currentY: number, neededHeight: number, pageHeight: number): number {
    const bottomMargin = 50; // Increased margin for footer
    if (currentY + neededHeight > pageHeight - bottomMargin) {
      doc.addPage();
      return 20; // reset Y near top for new page
    }
    return currentY;
  }

  // Add content with automatic pagination
  private addContentWithPagination(doc: any, content: string, currentY: number, pageHeight: number, maxWidth: number = 170): number {
    const lines = doc.splitTextToSize(content, maxWidth);
    const lineHeight = 5;
    const totalHeight = lines.length * lineHeight;
    
    // Check if we need a new page
    currentY = this.pdfEnsureSpace(doc, currentY, totalHeight, pageHeight);
    
    // Add the content
    doc.text(lines, 20, currentY);
    
    return currentY + totalHeight + 5; // Add some spacing after content
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

  // Helper methods for RGB colors
  getSeverityColorRGB(severity: string): [number, number, number] {
    if (!severity) return [107, 114, 128]; // gray-500
    const s = severity.toLowerCase();
    if (s.includes('mild') || s.includes('low')) return [34, 197, 94]; // green-500
    if (s.includes('moderate') || s.includes('medium')) return [234, 179, 8]; // yellow-500
    if (s.includes('severe') || s.includes('high')) return [239, 68, 68]; // red-500
    return [107, 114, 128]; // gray-500
  }

  getContagiousColorRGB(contagious: string): [number, number, number] {
    if (!contagious) return [107, 114, 128]; // gray-500
    const c = contagious.toLowerCase();
    if (c.includes('no') || c.includes('non')) return [34, 197, 94]; // green-500
    if (c.includes('yes') || c.includes('high')) return [239, 68, 68]; // red-500
    if (c.includes('low') || c.includes('moderate')) return [234, 179, 8]; // yellow-500
    return [107, 114, 128]; // gray-500
  }

  formatSymptom(symptom: string): string {
    return symptom.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  formatDiseaseName(disease: string): string {
    if (!disease) return '';
    return disease.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}
