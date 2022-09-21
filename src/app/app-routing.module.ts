import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeViewComponent } from './home/home-view/home-view.component';
import { SettingsViewComponent } from './settings/settings-view/settings-view.component';

const routes: Routes = [
  { path: 'home', component: HomeViewComponent },
  { path: 'settings', component: SettingsViewComponent },
  { path: '', redirectTo: 'home', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
