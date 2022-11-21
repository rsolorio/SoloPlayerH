import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerOverlayComponent } from './player-overlay.component';

describe('PlayerOverlayComponent', () => {
  let component: PlayerOverlayComponent;
  let fixture: ComponentFixture<PlayerOverlayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerOverlayComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
