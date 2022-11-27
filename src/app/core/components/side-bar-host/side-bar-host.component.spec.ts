import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideBarHostComponent } from './side-bar-host.component';

describe('SideBarHostComponent', () => {
  let component: SideBarHostComponent;
  let fixture: ComponentFixture<SideBarHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SideBarHostComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SideBarHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
