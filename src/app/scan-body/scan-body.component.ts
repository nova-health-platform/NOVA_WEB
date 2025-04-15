import { Component, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Importation de HttpClient
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scan-body',
  imports: [FormsModule, CommonModule],
  templateUrl: './scan-body.component.html',
  styleUrl: './scan-body.component.scss'
})
export class ScanBodyComponent {
  photo: File | null = null; // Stocke la photo sélectionnée ou capturée
  preview: string | null = null; // Prévisualisation de la photo
  response: any = null; // Réponse de l'API
  showCamera = false;
  showCanvas = false;

  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  private apiUrl = 'http://127.0.0.1:5000/api/scan-body'; // Remplacez par l'URL réelle de votre API

  constructor(private http: HttpClient) {}

  // Lorsque l'utilisateur sélectionne un fichier
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.photo = input.files[0];
      this.preview = URL.createObjectURL(this.photo);
    }
  }

  // Active la caméra pour prendre une photo
  capturePhoto(): void {
    this.showCamera = true;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const video = this.videoElement.nativeElement;
        video.srcObject = stream;
      })
      .catch((err) => console.error('Erreur d\'accès à la caméra: ', err));
  }

  // Capture une photo depuis la caméra
  takePhoto(): void {
    if (this.videoElement) {
      const canvas = this.canvasElement.nativeElement;
      const video = this.videoElement.nativeElement;
      canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) {
          this.photo = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          this.preview = canvas.toDataURL('image/jpeg');
          this.showCamera = false;
          this.showCanvas = true;
        }
      });
    }
  }

  // Envoie la photo à l'API
  uploadPhoto(): void {
    if (this.photo) {
      const formData = new FormData();
      formData.append('photo', this.photo);

      this.http.post(this.apiUrl, formData).subscribe(
        (response) => {
          this.response = response;
        },
        (error) => {
          console.error('Erreur lors de l\'upload:', error);
        }
      );
    }
  }
}
