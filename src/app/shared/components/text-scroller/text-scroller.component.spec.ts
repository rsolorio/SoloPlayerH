import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextScrollerComponent } from './text-scroller.component';

describe('TextScrollerComponent', () => {
  let component: TextScrollerComponent;
  let fixture: ComponentFixture<TextScrollerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TextScrollerComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TextScrollerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
