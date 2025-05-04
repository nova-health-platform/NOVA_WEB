import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IsiComponent } from './isi.component';

describe('IsiComponent', () => {
  let component: IsiComponent;
  let fixture: ComponentFixture<IsiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IsiComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IsiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
