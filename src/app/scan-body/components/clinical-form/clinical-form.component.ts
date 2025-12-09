import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-clinical-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './clinical-form.component.html',
  styleUrl: './clinical-form.component.scss'
})
export class ClinicalFormComponent implements OnInit {
  @Input() initialData?: {
    patientAge?: number;
    patientSex?: string;
    localization?: string;
  };
  
  @Output() formSubmit = new EventEmitter<any>();
  @Output() formChange = new EventEmitter<any>();
  
  clinicalForm!: FormGroup;
  
  readonly sexOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'unknown', label: 'Not specified' }
  ];
  
  readonly localizationOptions = [
    'abdomen', 'acral', 'back', 'chest', 'ear', 'face', 'foot', 'forearm',
    'hand', 'lower extremity', 'neck', 'scalp', 'trunk', 'upper extremity'
  ];
  
  constructor(private fb: FormBuilder) {}
  
  ngOnInit(): void {
    this.initForm();
    
    // Pre-fill if initial data provided
    if (this.initialData) {
      this.clinicalForm.patchValue(this.initialData);
    }
    
    // Emit form changes
    this.clinicalForm.valueChanges.subscribe(value => {
      this.formChange.emit(value);
    });
  }
  
  private initForm(): void {
    this.clinicalForm = this.fb.group({
      patientAge: [null, [Validators.required, Validators.min(0), Validators.max(120)]],
      patientSex: [null, Validators.required],
      localization: [null, Validators.required]
    });
  }
  
  get formControls() {
    return this.clinicalForm.controls;
  }
  
  onSubmit(): void {
    if (this.clinicalForm.valid) {
      this.formSubmit.emit(this.clinicalForm.value);
    } else {
      this.clinicalForm.markAllAsTouched();
    }
  }
  
  /**
   * Get form value (for parent component access)
   */
  getFormValue(): any {
    return this.clinicalForm.value;
  }
  
  /**
   * Check if form is valid
   */
  isFormValid(): boolean {
    return this.clinicalForm.valid;
  }
  
  isFieldInvalid(fieldName: string): boolean {
    const field = this.clinicalForm.get(fieldName);
    return !!(field && field.invalid && (field.touched || field.dirty));
  }
}

