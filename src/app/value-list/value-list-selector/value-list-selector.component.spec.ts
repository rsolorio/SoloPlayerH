import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ValueListSelectorComponent } from './value-list-selector.component';

describe('ValueListSelectorComponent', () => {
  let component: ValueListSelectorComponent;
  let fixture: ComponentFixture<ValueListSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ValueListSelectorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ValueListSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
