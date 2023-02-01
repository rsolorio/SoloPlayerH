import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterViewComponent } from './filter-view/filter-view.component';
import { QueryEditorComponent } from './query-editor/query-editor.component';
import { RouterModule } from '@angular/router';



@NgModule({
  declarations: [
    FilterViewComponent,
    QueryEditorComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      { path: 'queries/:id', component: QueryEditorComponent }
    ])
  ]
})
export class FilterModule { }
