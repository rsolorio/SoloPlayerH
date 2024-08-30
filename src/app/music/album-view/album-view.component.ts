import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ValueEditorType } from 'src/app/core/models/core.enum';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { IconActionArray } from 'src/app/core/models/icon-action-array.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { IEntityEditorModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { AlbumEntity, AlbumViewEntity, ValueListEntryEntity } from 'src/app/shared/entities';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { ValueLists } from 'src/app/shared/services/database/database.lists';

@Component({
  selector: 'sp-album-view',
  templateUrl: './album-view.component.html',
  styleUrls: ['./album-view.component.scss']
})
export class AlbumViewComponent implements OnInit {
  public entityEditorModel: IEntityEditorModel;
  private albumId: string;
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private navbarService: NavBarStateService,
    private entityService: DatabaseEntitiesService,
    private loadingService: LoadingViewStateService,
    private sidebarHostService: SideBarHostStateService
  ) { }

  ngOnInit(): void {
    this.albumId = this.utility.getRouteParam('id', this.route);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loadingService.show();
    await this.loadModel();
    this.initializeNavbar();
    this.loadingService.hide();
  }

  private async loadModel(): Promise<void> {
    const data = await AlbumViewEntity.findOneBy({ id: this.albumId });
    this.setupModel(data);
  }

  private setupModel(data: any): void {
    this.entityEditorModel = {
      data: data,
      groups: [
        {
          fields: [
            {
              propertyName: 'name',
              icon: AppAttributeIcons.AlbumName,
              label: 'Name'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'primaryArtistName',
              icon: AppAttributeIcons.ArtistName,
              label: 'Artist'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'releaseYear',
              icon: AppAttributeIcons.Year,
              label: 'Year'
            },
            {
              propertyName: 'albumType',
              icon: AppAttributeIcons.AlbumType,
              label: 'Type',
              onEdit: () => this.editAlbumType()
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'description',
              icon: AppAttributeIcons.Description,
              label: 'Description',
              editorType: ValueEditorType.Multiline,
              onEdit: field => field.editEnabled = true,
              onOk: field => {
                field.editEnabled = false;
                AlbumEntity.findOneBy({ id: this.albumId }).then(album => {
                  album.description = this.entityEditorModel.data['description'];
                  album.save();
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
      title: 'Album',
      leftIcon: {
        icon:  AppEntityIcons.Album
      },
      rightIcons: new IconActionArray(...[{
        icon: AppAttributeIcons.FavoriteOn,
        action: iconAction => {
          this.entityService.setFavoriteAlbum(this.albumId, false).then(() => {
            iconAction.off = true;
          });
        },
        offIcon: AppAttributeIcons.FavoriteOff,
        offAction: iconAction => {
          this.entityService.setFavoriteAlbum(this.albumId, true).then(() => {
            iconAction.off = false;
          });
        },
        off: !favorite
      }])
    });
  }

  private async editAlbumType(): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.AlbumType.id });
    const values = entries.map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.name,
        caption: entry.name
      };
      if (entry.name === this.entityEditorModel.data['albumType']) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Album Type',
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: values,
      onOk: model => {
        const selectedValues = model.items.filter(value => value.selected);
        const valuePair = selectedValues[0];
        if (valuePair.value !== this.entityEditorModel.data['albumType']) {
          this.entityEditorModel.data['albumType'] = valuePair.value;
          AlbumEntity.findOneBy({ id: this.entityEditorModel.data['id']}).then(album => {
            album.albumType = valuePair.value;
            album.save();
          });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }

}
