import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingImageComponent } from './loading-image.component';

describe('LoadingImageComponent', () => {
  let component: LoadingImageComponent;
  let fixture: ComponentFixture<LoadingImageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LoadingImageComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
