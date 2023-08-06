import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { IEntityEditorModel, IEntityFieldModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { SongClassificationEntity, ValueListEntryEntity } from 'src/app/shared/entities';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { In, Not } from 'typeorm';

@Component({
  selector: 'sp-song-view',
  templateUrl: './song-view.component.html',
  styleUrls: ['./song-view.component.scss']
})
export class SongViewComponent implements OnInit {
  public entityEditorModel: IEntityEditorModel;
  private classificationTypes: ValueListEntryEntity[];
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private entityService: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private sidebarHostService: SideBarHostStateService)
  { }

  ngOnInit(): void {
    const songId = this.utility.getRouteParam('id', this.route);
    this.initialize(songId);
  }

  private async initialize(songId: string): Promise<void> {
    this.loadingService.show();
    this.classificationTypes = await ValueListEntryEntity.findBy({
      valueListTypeId: ValueLists.ClassificationType.id,
      id: Not(ValueLists.ClassificationType.entries.Genre)
    });
    await this.loadModel(songId);
    this.initializeNavbar();
    this.loadingService.hide();
  }

  private async loadModel(songId: string): Promise<void> {
    const data = await this.entityService.getSongDetails(songId);
    // Prepare the editor
    this.entityEditorModel = {
      data: data,
      groups: [
        {
          fields: [
            {
              propertyName: 'song_name',
              icon: 'mdi-music mdi',
              label: 'Title'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'primaryArtistName',
              icon: 'mdi-account-music mdi',
              label: 'Artist'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'primaryAlbumName',
              icon: 'mdi-album mdi',
              label: 'Album'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_trackNumber',
              icon: 'mdi-pound mdi',
              label: 'Track'
            },
            {
              propertyName: 'song_duration',
              icon: 'mdi-timer-outline mdi',
              label: 'Duration'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_releaseYear',
              icon: 'mdi-calendar-blank mdi',
              label: 'Year'
            },
            {
              propertyName: 'song_genre',
              icon: 'mdi-tag mdi',
              label: 'Genre',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_language',
              icon: 'mdi-translate mdi',
              label: 'Language',
              onEdit: () => {}
            },
            {
              propertyName: 'song_mood',
              icon: 'mdi-emoticon mdi',
              label: 'Mood',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'song_playCount',
              icon: 'mdi-play mdi',
              label: 'Play Count'
            },
            {
              propertyName: 'song_addDate',
              icon: 'mdi-calendar-plus mdi',
              label: 'Add Date'
            }
          ]
        }
      ]
    };
    // Load extra data
    let classifications: ValueListEntryEntity[] = [];
    const songClassifications = await SongClassificationEntity.findBy({ songId: songId });
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

  private initializeNavbar(): void {
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
        icon:  'mdi-music-note mdi'
      }
    });
  }

  private getClassificationTypeIcon(classificationTypeId: string): string {
    switch (classificationTypeId) {
      case ValueLists.ClassificationType.entries.Category:
        return 'mdi-sticker-text mdi';
      case ValueLists.ClassificationType.entries.Instrument:
        return 'mdi-guitar-acoustic mdi';
      case ValueLists.ClassificationType.entries.Occasion:
        return 'mdi-snowman mdi';
      case ValueLists.ClassificationType.entries.Subgenre:
        return 'mdi-tag-multiple mdi';
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
      values: valuePairs,
      onValueSelectionChanged: valuePair => {
        this.onClassificationSelected(valuePair);
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
