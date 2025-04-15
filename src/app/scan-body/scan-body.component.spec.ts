import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanBodyComponent } from './scan-body.component';

describe('ScanBodyComponent', () => {
  let component: ScanBodyComponent;
  let fixture: ComponentFixture<ScanBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanBodyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
