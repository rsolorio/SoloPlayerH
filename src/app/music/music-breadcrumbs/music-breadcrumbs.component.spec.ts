import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MusicBreadcrumbsComponent } from './music-breadcrumbs.component';

describe('MusicBreadcrumbsComponent', () => {
  let component: MusicBreadcrumbsComponent;
  let fixture: ComponentFixture<MusicBreadcrumbsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MusicBreadcrumbsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MusicBreadcrumbsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
