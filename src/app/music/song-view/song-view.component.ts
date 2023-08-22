import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ValueEditorType } from 'src/app/core/models/core.enum';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { IEntityEditorModel, IEntityFieldModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { SongClassificationEntity, SongEntity, ValueListEntryEntity } from 'src/app/shared/entities';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { In, Not } from 'typeorm';

@Component({
  selector: 'sp-song-view',
  templateUrl: './song-view.component.html',
  styleUrls: ['./song-view.component.scss']
})
export class SongViewComponent implements OnInit {
  public entityEditorModel: IEntityEditorModel;
  private songId: string;
  private classificationTypes: ValueListEntryEntity[];
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private entityService: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private navigation: NavigationService,
    private sidebarHostService: SideBarHostStateService)
  { }

  ngOnInit(): void {
    this.songId = this.utility.getRouteParam('id', this.route);
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loadingService.show();
    this.classificationTypes = await ValueListEntryEntity.findBy({
      valueListTypeId: ValueLists.ClassificationType.id,
      id: Not(ValueLists.ClassificationType.entries.Genre)
    });
    await this.loadModel();
    this.initializeNavbar();
    this.loadingService.hide();
  }

  private async loadModel(): Promise<void> {
    const data = await this.entityService.getSongDetails(this.songId);
    // Prepare the editor
    this.setupModel(data);
    // Add classification fields
    let classifications: ValueListEntryEntity[] = [];
    const songClassifications = await SongClassificationEntity.findBy({ songId: this.songId });
    if (songClassifications.length) {
      classifications = await ValueListEntryEntity.findBy({
        id: In(songClassifications.map(c => c.classificationId))
      });
    }
    for (const classificationType of this.classificationTypes) {
      // Default value
      data[classificationType.name] = '<None>';
      // Find out if there's data
      const entries = classifications.filter(
        c => c.valueListTypeId === classificationType.id);
      if (entries.length) {
        data[classificationType.name] = entries.map(s => s.name).join(', ');
        // Hack: save a list of selected ids in case we need to edit
        data[classificationType.id] = entries.map(s => s.id);
      }
      // Create the field
      this.entityEditorModel.groups.push({ fields: [{
        propertyName: classificationType.name,
        icon: this.getClassificationTypeIcon(classificationType.id),
        label: classificationType.name,
        onEdit: () => {
          let selectedEntries: string[] = [];
          if (this.entityEditorModel.data[classificationType.id]) {
            selectedEntries = this.entityEditorModel.data[classificationType.id];
          }
          this.editClassification(classificationType.id, classificationType.name, selectedEntries);
        }
      }]});
    }
  }

  private setupModel(data: any): void {
    this.entityEditorModel = {
      data: data,
      groups: [
        {
          fields: [
            {
              propertyName: 'song_name',
              icon: AppAttributeIcons.SongName,
              label: 'Title'
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
              propertyName: 'primaryAlbumName',
              icon: AppAttributeIcons.AlbumName,
              label: 'Album'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_trackNumber',
              icon: AppAttributeIcons.TrackNumber,
              label: 'Track'
            },
            {
              propertyName: 'song_duration',
              icon: AppAttributeIcons.Duration,
              label: 'Duration'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_releaseYear',
              icon: AppAttributeIcons.Year,
              label: 'Year'
            },
            {
              propertyName: 'song_genre',
              icon: AppEntityIcons.Genre,
              label: 'Genre',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_language',
              icon: AppAttributeIcons.Language,
              label: 'Language',
              onEdit: () => {}
            },
            {
              propertyName: 'song_mood',
              icon: AppAttributeIcons.Mood,
              label: 'Mood',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_playCount',
              icon: AppAttributeIcons.PlayCount,
              label: 'Play Count'
            },
            {
              propertyName: 'song_addDate',
              icon: AppAttributeIcons.AddDate,
              label: 'Add Date'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_live',
              icon: AppAttributeIcons.LiveOn,
              label: 'Live',
              editorType: ValueEditorType.YesNo,
              onEdit: () => {
                SongEntity.findOneBy({ id: this.songId }).then(song => {
                  song.live = !this.entityEditorModel.data['song_live'];
                  song.save().then(() => {
                    this.entityEditorModel.data['song_live'] = song.live;
                  });
                });
              }
            },
            {
              propertyName: 'song_explicit',
              icon: AppAttributeIcons.Explicit,
              label: 'Explicit',
              editorType: ValueEditorType.YesNo,
              onEdit: () => {
                SongEntity.findOneBy({ id: this.songId }).then(song => {
                  song.explicit = !this.entityEditorModel.data['song_explicit'];
                  song.save().then(() => {
                    this.entityEditorModel.data['song_explicit'] = song.explicit;
                  });
                });
              }
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_grouping',
              icon: AppAttributeIcons.Grouping,
              label: 'Grouping',
              onEdit: () => {}
            },
          ]
        }
      ]
    };
  }

  private initializeNavbar(): void {
    const favorite = this.entityEditorModel.data['song_favorite'] as number;
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Toggle Labels',
          action: () => {
            this.entityEditorModel.groups.forEach(g => {
              g.fields.forEach(f => {
                f.labelVisible = !f.labelVisible;
              });
            });
          }
        }
      ],
      title: 'Song',
      leftIcon: {
        icon:  AppActionIcons.Back,
        action: () => {
          this.navigation.back();
        }
      },
      rightIcons: [{
        icon: AppAttributeIcons.FavoriteOn,
        action: iconAction => {
          this.entityService.setFavoriteSong(this.songId, false).then(response => {
            iconAction.off = true;
          });
        },
        offIcon: AppAttributeIcons.FavoriteOff,
        offAction: iconAction => {
          this.entityService.setFavoriteSong(this.songId, true).then(response => {
            iconAction.off = false;
          });
        },
        off: !favorite
      }]
    });
  }

  private getClassificationTypeIcon(classificationTypeId: string): string {
    switch (classificationTypeId) {
      case ValueLists.ClassificationType.entries.Category:
        return AppEntityIcons.Category;
      case ValueLists.ClassificationType.entries.Instrument:
        return AppEntityIcons.Instrument;
      case ValueLists.ClassificationType.entries.Occasion:
        return AppEntityIcons.Occasion;
      case ValueLists.ClassificationType.entries.Subgenre:
        return AppEntityIcons.Subgenre;
    }
    return '';
  }

  private async editClassification(classificationTypeId: string, classificationTypeName: string, selectedEntries: string[]): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: classificationTypeId });
    const valuePairs = entries.map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.id,
        caption: entry.name
      };
      if (selectedEntries.includes(entry.id)) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: classificationTypeName,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Multiple,
      items: valuePairs,
      onChipClick: (selectionChanged, chipItem) => {
        this.onClassificationSelected(chipItem);
      },
      // In this case this is the Close action
      onCancel: () => {
        const field = this.findFieldByProperty(classificationTypeName);
        const selectedValuePairs = valuePairs.filter(v => v.selected);
        if (selectedValuePairs.length) {
          this.entityEditorModel.data[classificationTypeName] = selectedValuePairs.map(v => v.caption).join(', ');
          this.entityEditorModel.data[classificationTypeId] = selectedValuePairs.map(v => v.value);
          if (selectedValuePairs.length > 1) {
            field.badge = selectedValuePairs.length.toString();
          }
          else {
            field.badge = null;
          }
        }
        else {
          this.entityEditorModel.data[classificationTypeName] = '<None>';
          this.entityEditorModel.data[classificationTypeId] = [];
          field.badge = null;
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }

  private async onClassificationSelected(valuePair: ISelectableValue): Promise<void> {
    if (valuePair.selected) {
      const songClassification = new SongClassificationEntity();
      songClassification.songId = this.entityEditorModel.data['song_id'];
      songClassification.classificationId = valuePair.value;
      // TODO: determine how to setup this one
      songClassification.primary = false;
      await songClassification.save();
    }
    else {
      await SongClassificationEntity.delete({ songId: this.entityEditorModel.data['song_id'], classificationId: valuePair.value})
    }
  }

  private findFieldByProperty(propertyName: string): IEntityFieldModel {
    let result: IEntityFieldModel;
    this.entityEditorModel.groups.forEach(g => {
      g.fields.forEach(f => {
        if (f.propertyName === propertyName) {
          result = f;
        }
      });
    });
    return result;
  }

}
