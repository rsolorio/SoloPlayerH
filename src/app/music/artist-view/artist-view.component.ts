import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { IEntityEditorModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';

@Component({
  selector: 'sp-artist-view',
  templateUrl: './artist-view.component.html',
  styleUrls: ['./artist-view.component.scss']
})
export class ArtistViewComponent implements OnInit {
  public entityEditorModel: IEntityEditorModel;
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private entityService: DatabaseEntitiesService,
    private navbarService: NavBarStateService
  )
  { }

  public ngOnInit(): void {
    const artistId = this.utility.getRouteParam('id', this.route);
    this.initialize(artistId);
  }

  private async initialize(artistId: string): Promise<void> {
    this.loadingService.show();
    await this.loadModel(artistId);
    this.initializeNavbar();
    this.loadingService.hide();
  }

  private async loadModel(artistId: string): Promise<void> {
    const data = await this.entityService.getArtistDetails(artistId);
    this.entityEditorModel = {
      data: data,
      fields: [
        {
          propertyName: 'artist_name', icon: 'mdi-account mdi'
        },
        {
          propertyName: 'artistType', icon: 'mdi-account-multiple-outline mdi'
        },
        {
          propertyName: 'country', icon: 'mdi-earth mdi'
        }
      ]
    };    
  }

  private initializeNavbar(): void {
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Some Option'
        }
      ],
      title: 'Artist',
      leftIcon: {
        icon:  'mdi-account-music mdi'
      }
    });
  }

}
