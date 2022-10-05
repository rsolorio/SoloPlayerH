import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtistListComponent } from './artist-list/artist-list.component';
import { CoreModule } from '../core/core.module';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    ArtistListComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    SharedModule,
    BrowserModule,
    BrowserAnimationsModule
  ],
  entryComponents: [ ArtistListComponent ]
})
export class MusicModule { }
