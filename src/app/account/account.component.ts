import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html'
})
export class AccountComponent implements OnInit {
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

  showResetPasswordModal = false;
  isResetting = false;
  resetData = { old_password: '', new_password: '', confirm_password: '' };

  showEditAccountModal = false;

  /** ✅ Afficher/Masquer les champs avancés */
  showAdvanced = false;          // Pour l'ajout de profil
  showAdvancedFields = false;    // Pour l'édition de profil

  /** ✅ Pays */
  countries: any[] = [];
  filteredCountries: any[] = [];
  countrySearch = '';

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

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnInit() {
    this.loadUser();
    this.loadProfiles();
    this.loadHistory();
    this.loadCountries();
    this.loadAllergyTypes();
    this.loadChronicConditionTypes();
    this.loadFamilyHistoryOptions();
    this.loadVaccinationList();
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
  }

  /** ✅ Charger les infos utilisateur */
  loadUser() {
    this.http.get(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => this.user = data);
  }

  /** ✅ Charger les profils */
  loadProfiles() {
    this.http.get<any[]>(`${this.apiUrl}/profiles`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => this.profiles = data);
  }

  /** ✅ Charger l'historique */
  loadHistory() {
    this.http.get<any[]>(`${this.apiUrl}/history`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => this.history = data);
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

  /** ✅ Créer un profil */
  createProfile() {
    if (!this.isFormValid() || this.profiles.length >= this.user?.max_profiles) return;

    this.http.post(`${this.apiUrl}/profiles`, this.newProfile, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe({
      next: () => {
        this.loadProfiles();
        this.resetNewProfile();
        this.showAdvanced = false;
      },
      error: () => alert('Failed to create profile.')
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
}
