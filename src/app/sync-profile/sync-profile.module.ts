import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncProfileListComponent } from './sync-profile-list/sync-profile-list.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    SyncProfileListComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class SyncProfileModule { }
