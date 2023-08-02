import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { IIconAction, ISelectableValue } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { IEntityEditorModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { ArtistEntity, ValueListEntryEntity } from 'src/app/shared/entities';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { ValueLists } from 'src/app/shared/services/database/database.lists';

@Component({
  selector: 'sp-artist-view',
  templateUrl: './artist-view.component.html',
  styleUrls: ['./artist-view.component.scss']
})
export class ArtistViewComponent implements OnInit {
  public entityEditorModel: IEntityEditorModel;
  private artistId: string;
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private entityService: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private sidebarHostService: SideBarHostStateService
  )
  { }

  public ngOnInit(): void {
    this.artistId = this.utility.getRouteParam('id', this.route);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loadingService.show();
    await this.loadModel();
    this.initializeNavbar();
    this.loadingService.hide();
  }

  private async loadModel(): Promise<void> {
    const data = await this.entityService.getArtistDetails(this.artistId);
    this.entityEditorModel = {
      data: data,
      groups: [
        {
          fields: [
            {
              propertyName: 'artist_name',
              icon: 'mdi-account mdi',
              label: 'Name'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'artistType',
              icon: 'mdi-account-multiple-outline mdi',
              label: 'Type',
              onEdit: () => this.editArtistType()
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'country',
              icon: 'mdi-earth mdi',
              label: 'Country',
              onEdit: () => this.editCountry()
            }
          ]
        }
      ]
    };    
  }

  private initializeNavbar(): void {
    const favorite = this.entityEditorModel.data['artist_favorite'] as number;
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
      },
      rightIcon: {
        icon: favorite ? 'mdi-heart mdi' : 'mdi-heart-outline mdi',
        action: param => {
          const iconAction = param as IIconAction;
          const isFavorite = iconAction.icon === 'mdi-heart mdi';
          this.entityService.setFavoriteArtist(this.artistId, !isFavorite).then(response => {
            iconAction.icon = response ? 'mdi-heart mdi' : 'mdi-heart-outline mdi'
          });
        }
      }
    });
  }

  private async editArtistType(): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.ArtistType.id });
    const values = entries.map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.id,
        caption: entry.name
      };
      if (entry.id === this.entityEditorModel.data['artist_artistTypeId']) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Artist Type',
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.SingleOk,
      values: values,
      onOk: model => {
        const selectedValues = model.values.filter(value => value.selected);
        const valuePair = selectedValues[0];
        if (valuePair.value !== this.entityEditorModel.data['artist_artistTypeId']) {
          this.entityEditorModel.data['artist_artistTypeId'] = valuePair.value;
          this.entityEditorModel.data['artistType'] = valuePair.caption;
          ArtistEntity.findOneBy({ id: this.entityEditorModel.data['artist_id']}).then(artist => {
            artist.artistTypeId = valuePair.value;
            artist.save();
          });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }

  private async editCountry(): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Country.id });
    const values = entries.map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.id,
        caption: entry.name
      };
      if (entry.id === this.entityEditorModel.data['artist_countryId']) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Country',
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.SingleOk,
      values: values,
      onOk: model => {
        const selectedValues = model.values.filter(value => value.selected);
        const valuePair = selectedValues[0];
        if (valuePair.value !== this.entityEditorModel.data['artist_countryId']) {
          this.entityEditorModel.data['artist_countryId'] = valuePair.value;
          this.entityEditorModel.data['country'] = valuePair.caption;
          ArtistEntity.findOneBy({ id: this.entityEditorModel.data['artist_id']}).then(artist => {
            artist.countryId = valuePair.value;
            artist.save();
          });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }

}
