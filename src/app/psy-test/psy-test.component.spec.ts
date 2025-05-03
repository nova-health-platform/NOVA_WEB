import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PsyTestComponent } from './psy-test.component';

describe('PsyTestComponent', () => {
  let component: PsyTestComponent;
  let fixture: ComponentFixture<PsyTestComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PsyTestComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PsyTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
