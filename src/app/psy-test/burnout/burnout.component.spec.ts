import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BurnoutComponent } from './burnout.component';

describe('BurnoutComponent', () => {
  let component: BurnoutComponent;
  let fixture: ComponentFixture<BurnoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BurnoutComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BurnoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
