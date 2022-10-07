import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeViewComponent } from './home/home-view/home-view.component';
import { ArtistListComponent } from './music/artist-list/artist-list.component';
import { MusicModule } from './music/music.module';
import { SettingsViewComponent } from './settings/settings-view/settings-view.component';

const routes: Routes = [
  { path: 'home', component: HomeViewComponent },
  { path: 'settings', component: SettingsViewComponent },
  { path: 'artists', component: ArtistListComponent },
  { path: 'albumartists', component: ArtistListComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' }),
    MusicModule
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
