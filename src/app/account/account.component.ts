import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  /** ✅ URL API (centralisée) */
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUser();
    this.loadProfiles();
    this.loadHistory();
    this.loadCountries();
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
      allergies: { substance: '', severity: '' },
      chronic_conditions: { condition_name: '', diagnosed_date: '' },
      surgeries: { surgery_type: '', surgery_date: '' },
      family_history: { relation: '', condition: '' },
      vaccinations: { vaccine_name: '', vaccination_date: '' },
      medications: { medication_name: '', dosage: '' }
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
}
