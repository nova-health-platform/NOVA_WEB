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
  user: any;
  profiles: any[] = [];
  history: any[] = [];
  newProfile = { first_name: '', last_name: '', birth_date: '', sex: '', weight: '', height: '' };

  showEditModal = false;
  selectedProfile: any = null;
  isUpdating = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUser();
    this.loadProfiles();
    this.loadHistory();
  }

  loadUser() {
    this.http.get('http://localhost:5000/api/me', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => this.user = data);
  }

  loadProfiles() {
    this.http.get<any[]>('http://localhost:5000/api/profiles', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => this.profiles = data);
  }

  loadHistory() {
    this.http.get<any[]>('http://localhost:5000/api/history', {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe((data) => this.history = data);
  }

  isFormValid(): boolean {
    return (
      this.newProfile.first_name.trim() !== '' &&
      this.newProfile.last_name.trim() !== '' &&
      this.newProfile.birth_date.trim() !== '' &&
      this.newProfile.sex.trim() !== '' &&
      Number(this.newProfile.weight) > 0 &&
      Number(this.newProfile.height) > 0
    );
  }


  createProfile() {
    if (!this.isFormValid() || this.profiles.length >= this.user?.max_profiles) return;

    this.http.post('http://localhost:5000/api/profiles', this.newProfile, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe(() => {
      this.loadProfiles();
      this.newProfile = { first_name: '', last_name: '', birth_date: '', sex: '', weight: '', height: '' };
    });
  }

  deleteProfile(id: number) {
    this.http.delete(`http://localhost:5000/api/profiles/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
    }).subscribe(() => this.loadProfiles());
  }

  /** ✅ Ouvre le modal avec les données du profil */
  editProfile(profile: any) {
    this.selectedProfile = { ...profile };

    if (this.selectedProfile.birth_date) {
      this.selectedProfile.birth_date = this.formatDateForInput(this.selectedProfile.birth_date);
    }

    this.showEditModal = true;

    // ✅ Bloque le scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }

  formatDateForInput(date: string): string {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  /** ✅ Ferme le modal */
  closeEditModal() {
    this.showEditModal = false;
    this.selectedProfile = null;

    // ✅ Restaure le scroll
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
  }

  /** ✅ Met à jour le profil */
  updateProfile() {
    if (!this.selectedProfile) return;
    this.isUpdating = true;

    this.http.put(`http://localhost:5000/api/profiles/${this.selectedProfile.id}`, this.selectedProfile, {
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
}
