import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppActionIcons, AppAttributeIcons } from 'src/app/app-icons';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ValueEditorType } from 'src/app/core/models/core.enum';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { IEntityEditorModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { ArtistEntity, ValueListEntryEntity } from 'src/app/shared/entities';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';

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
    private navigation: NavigationService,
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
    const data = await ArtistEntity.findOneBy({ id: this.artistId });
    this.entityEditorModel = {
      data: data,
      groups: [
        {
          fields: [
            {
              propertyName: 'name',
              icon: AppAttributeIcons.ArtistName,
              label: 'Name'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'artistType',
              icon: AppAttributeIcons.ArtistType,
              label: 'Type',
              onEdit: () => this.editArtistType()
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'country',
              icon: AppAttributeIcons.Country,
              label: 'Country',
              onEdit: () => this.editCountry()
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'artistGender',
              icon: AppAttributeIcons.Gender,
              label: 'Gender',
              onEdit: () => this.editGender()
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'vocal',
              icon: AppAttributeIcons.Vocal,
              label: 'Vocal',
              editorType: ValueEditorType.YesNo,
              onEdit: () => {
                ArtistEntity.findOneBy({ id: this.artistId }).then(artist => {
                  artist.vocal = !this.entityEditorModel.data['vocal'];
                  artist.save().then(() => {
                    this.entityEditorModel.data['vocal'] = artist.vocal;
                  });
                });
              }
            }
          ]
        }
      ]
    };    
  }

  private initializeNavbar(): void {
    const favorite = this.entityEditorModel.data['favorite'] as number;
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
        icon:  AppActionIcons.Back,
        action: () => {
          this.navigation.back();
        }
      },
      rightIcons: [{
        icon: AppAttributeIcons.FavoriteOn,
        action: iconAction => {
          this.entityService.setFavoriteArtist(this.artistId, false).then(() => {
            iconAction.off = true;
          });
        },
        offIcon: AppAttributeIcons.FavoriteOff,
        offAction: iconAction => {
          this.entityService.setFavoriteArtist(this.artistId, true).then(() => {
            iconAction.off = false;
          });
        },
        off: !favorite
      }]
    });
  }

  private async editArtistType(): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.ArtistType.id });
    const values = entries.map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.name,
        caption: entry.name
      };
      if (entry.name === this.entityEditorModel.data['artistType']) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Artist Type',
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: values,
      onOk: model => {
        const selectedValues = model.items.filter(value => value.selected);
        const valuePair = selectedValues[0];
        if (valuePair.value !== this.entityEditorModel.data['artistType']) {
          this.entityEditorModel.data['artistType'] = valuePair.value;
          ArtistEntity.findOneBy({ id: this.entityEditorModel.data['id']}).then(artist => {
            artist.artistType = valuePair.value;
            artist.save();
          });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }

  private async editCountry(): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Country.id });
    const values = this.utility.sort(entries, 'name').map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.name,
        caption: entry.name
      };
      if (entry.name === this.entityEditorModel.data['country']) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Country',
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: values,
      onOk: model => {
        const selectedValues = model.items.filter(value => value.selected);
        const valuePair = selectedValues[0];
        if (valuePair.value !== this.entityEditorModel.data['country']) {
          this.entityEditorModel.data['country'] = valuePair.value;
          ArtistEntity.findOneBy({ id: this.entityEditorModel.data['id']}).then(artist => {
            artist.country = valuePair.value;
            artist.save();
          });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }

  private async editGender(): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Gender.id });
    const values = entries.map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.name,
        caption: entry.name
      };
      if (entry.name === this.entityEditorModel.data['artistGender']) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Gender',
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: values,
      onOk: model => {
        const selectedValues = model.items.filter(value => value.selected);
        const valuePair = selectedValues[0];
        if (valuePair.value !== this.entityEditorModel.data['artistGender']) {
          this.entityEditorModel.data['artistGender'] = valuePair.value;
          ArtistEntity.findOneBy({ id: this.entityEditorModel.data['id']}).then(artist => {
            artist.artistGender = valuePair.value;
            artist.save();
          });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }
}
