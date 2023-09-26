import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SyncProfileListComponent } from './sync-profile-list.component';

describe('SyncProfileListComponent', () => {
  let component: SyncProfileListComponent;
  let fixture: ComponentFixture<SyncProfileListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SyncProfileListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SyncProfileListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
