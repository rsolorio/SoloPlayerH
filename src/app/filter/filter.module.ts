import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterViewComponent } from './filter-view/filter-view.component';
import { QueryEditorComponent } from './query-editor/query-editor.component';
import { RouterModule } from '@angular/router';
import { FilterListComponent } from './filter-list/filter-list.component';
import { SharedModule } from '../shared/shared.module';



@NgModule({
  declarations: [
    FilterViewComponent,
    QueryEditorComponent,
    FilterListComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild([
      { path: 'queries/:id', component: QueryEditorComponent }
    ])
  ]
})
export class FilterModule { }
