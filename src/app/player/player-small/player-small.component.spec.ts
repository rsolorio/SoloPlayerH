import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerSmallComponent } from './player-small.component';

describe('PlayerSmallComponent', () => {
  let component: PlayerSmallComponent;
  let fixture: ComponentFixture<PlayerSmallComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerSmallComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerSmallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
