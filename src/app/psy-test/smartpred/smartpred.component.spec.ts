import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartpredComponent } from './smartpred.component';

describe('SmartpredComponent', () => {
  let component: SmartpredComponent;
  let fixture: ComponentFixture<SmartpredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartpredComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartpredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
