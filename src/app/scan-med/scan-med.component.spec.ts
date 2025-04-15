import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanMedComponent } from './scan-med.component';

describe('ScanMedComponent', () => {
  let component: ScanMedComponent;
  let fixture: ComponentFixture<ScanMedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanMedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanMedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
