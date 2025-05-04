import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gad7Component } from './gad7.component';

describe('Gad7Component', () => {
  let component: Gad7Component;
  let fixture: ComponentFixture<Gad7Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gad7Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Gad7Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
