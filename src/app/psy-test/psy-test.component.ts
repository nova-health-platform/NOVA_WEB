import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-psy-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './psy-test.component.html',
  styleUrls: ['./psy-test.component.scss']
})
export class PsyTestComponent {
  activeModal: 'phq' | 'smart' | 'gad7' | 'dass21' | 'isi' | 'burnout' | null = null;

  openModal(id: 'phq' | 'smart' | 'gad7' | 'dass21' | 'isi' | 'burnout') {
    this.activeModal = id;
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.activeModal = null;
    document.body.style.overflow = '';
  }
}



