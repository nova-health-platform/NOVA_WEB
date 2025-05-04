import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Phq9Component } from './phq9.component';

describe('Phq9Component', () => {
  let component: Phq9Component;
  let fixture: ComponentFixture<Phq9Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Phq9Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Phq9Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
