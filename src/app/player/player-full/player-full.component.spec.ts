import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerFullComponent } from './player-full.component';

describe('PlayerFullComponent', () => {
  let component: PlayerFullComponent;
  let fixture: ComponentFixture<PlayerFullComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerFullComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerFullComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
