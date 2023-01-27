import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChipSelectionComponent } from './chip-selection.component';

describe('ChipSelectionComponent', () => {
  let component: ChipSelectionComponent;
  let fixture: ComponentFixture<ChipSelectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChipSelectionComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChipSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
