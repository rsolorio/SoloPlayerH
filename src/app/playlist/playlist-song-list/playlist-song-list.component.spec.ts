import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlaylistSongListComponent } from './playlist-song-list.component';

describe('PlaylistSongListComponent', () => {
  let component: PlaylistSongListComponent;
  let fixture: ComponentFixture<PlaylistSongListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlaylistSongListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaylistSongListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
