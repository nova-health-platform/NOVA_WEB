import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Dass21Component } from './dass21.component';

describe('Dass21Component', () => {
  let component: Dass21Component;
  let fixture: ComponentFixture<Dass21Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dass21Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Dass21Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
