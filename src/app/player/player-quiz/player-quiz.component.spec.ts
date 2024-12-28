import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerQuizComponent } from './player-quiz.component';

describe('PlayerQuizComponent', () => {
  let component: PlayerQuizComponent;
  let fixture: ComponentFixture<PlayerQuizComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlayerQuizComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayerQuizComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
