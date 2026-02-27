import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AppEvent } from 'src/app/app-events';
import { AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ValueEditorType } from 'src/app/core/models/core.enum';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { IconActionArray } from 'src/app/core/models/icon-action-array.class';
import { EventsService } from 'src/app/core/services/events/events.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { FileService } from 'src/app/platform/file/file.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { IEntityEditorModel, IEntityFieldModel } from 'src/app/shared/components/entity-editor/entity-editor.interface';
import { SongClassificationEntity, SongEntity, SongExtendedViewEntity, ValueListEntryEntity } from 'src/app/shared/entities';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
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
  private songId: string;
  private classificationTypes: ValueListEntryEntity[];
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private entityService: DatabaseEntitiesService,
    private navbarService: NavBarStateService,
    private events: EventsService,
    private sidebarHostService: SideBarHostStateService,
    private fileService: FileService)
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
    const song = await SongExtendedViewEntity.findOneBy({ id: this.songId });
    // Prepare the editor
    this.setupModel(song);
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
      song[classificationType.name] = '<None>';
      // Find out if there's data
      const entries = classifications.filter(
        c => c.valueListTypeId === classificationType.id);
      if (entries.length) {
        song[classificationType.name] = entries.map(s => s.name).join(', ');
        // Hack: save a list of selected ids in case we need to edit
        song[classificationType.id] = entries.map(s => s.id);
      }
      // Create the field
      this.entityEditorModel.groups.push({ fields: [{
        propertyName: classificationType.name,
        icon: this.getClassificationTypeIcon(classificationType.id),
        label: classificationType.name,
        editorType: ValueEditorType.ValueList,
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
              propertyName: 'name',
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
              propertyName: 'trackNumber',
              icon: AppAttributeIcons.TrackNumber,
              label: 'Track'
            },
            {
              propertyName: 'duration',
              icon: AppAttributeIcons.Duration,
              label: 'Duration'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'mediaNumber',
              icon: AppAttributeIcons.MediaNumber,
              label: 'Disc Number'
            },
            {
              propertyName: 'mediaSubtitle',
              icon: AppAttributeIcons.MediaSubtitle,
              label: 'Disc Title'
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
              propertyName: 'genre',
              icon: AppEntityIcons.Genre,
              label: 'Genre',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'language',
              icon: AppAttributeIcons.Language,
              label: 'Language',
              onEdit: () => {
                this.editLanguage();
              }
            },
            {
              propertyName: 'mood',
              icon: AppAttributeIcons.MoodOn,
              label: 'Mood',
              onEdit: () => {}
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'rating',
              icon: AppAttributeIcons.RatingOn,
              label: 'Rating'
            },
            {
              propertyName: 'playCount',
              icon: AppAttributeIcons.PlayCount,
              label: 'Play Count'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'live',
              icon: AppAttributeIcons.LiveOn,
              label: 'Live',
              editorType: ValueEditorType.YesNo,
              onEdit: () => {
                SongEntity.findOneBy({ id: this.songId }).then(song => {
                  song.live = !this.entityEditorModel.data['live'];
                  song.save().then(() => {
                    this.entityEditorModel.data['live'] = song.live;
                    this.events.broadcast(AppEvent.ViewSongUpdated, song);
                  });
                });
              }
            },
            {
              propertyName: 'advisory',
              icon: AppAttributeIcons.Advisory,
              label: 'Advisory',
              editorType: ValueEditorType.Number,
              onEdit: () => {
              }
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'bitrate',
              icon: AppAttributeIcons.Bitrate,
              label: 'Bitrate'
            },
            {
              propertyName: 'frequency',
              icon: AppAttributeIcons.Frequency,
              label: 'Frequency'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'vbr',
              icon: AppAttributeIcons.Vbr,
              label: 'VBR',
              editorType: ValueEditorType.YesNo
            },
            {
              propertyName: 'replayGain',
              icon: AppAttributeIcons.ReplayGain,
              label: 'ReplayGain',
              editorType: ValueEditorType.Number,
              onEdit: field => {
                field.editEnabled = true;
              },
              onOk: field => {
                field.editEnabled = false;
                const replayGainText = this.entityEditorModel.data['replayGain'];
                if (replayGainText) {
                  const replayGain = parseFloat(replayGainText);
                  if (!isNaN(replayGain)) {
                    SongEntity.findOneBy({ id: this.songId }).then(song => {
                      song.replayGain = replayGain;
                      song.save();
                    });
                  }
                }
              }
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'addDate',
              icon: AppAttributeIcons.AddDate,
              label: 'Add Date'
            }
          ]
        },
        {
          fields: [
            {
              propertyName: 'grouping',
              icon: AppAttributeIcons.Grouping,
              label: 'Grouping',
              onEdit: () => {}
            },
          ]
        },
        {
          fields: [
            {
              propertyName: 'infoUrl',
              icon: AppAttributeIcons.Link,
              label: 'Info Url',
              onEdit: field => {
                field.editEnabled = true;
              },
              onOk: field => {
                field.editEnabled = false;
                SongEntity.findOneBy({ id: this.songId }).then(song => {
                  song.infoUrl = this.entityEditorModel.data['infoUrl'];
                  song.save();
                });
              }
            },
          ]
        },
        {
          fields: [
            {
              propertyName: 'videoUrl',
              icon: AppAttributeIcons.VideoOn,
              label: 'Video Url',
              onEdit: field => {
                field.editEnabled = true;
              },
              onOk: field => {
                field.editEnabled = false;
                SongEntity.findOneBy({ id: this.songId }).then(song => {
                  song.videoUrl = this.entityEditorModel.data['videoUrl'];
                  song.save();
                });
              }
            },
          ]
        },
        {
          fields: [
            {
              propertyName: 'comment',
              icon: AppAttributeIcons.Description,
              label: 'Comment',
              editorType: ValueEditorType.Multiline,
              onEdit: field => {
                field.editEnabled = true;
              },
              onOk: field => {
                field.editEnabled = false;
                SongEntity.findOneBy({ id: this.songId }).then(song => {
                  song.comment = this.entityEditorModel.data['comment'];
                  song.save();
                });
              }
            },
          ]
        },
        {
          fields: [
            {
              propertyName: 'mbId',
              icon: AppAttributeIcons.MbId,
              label: 'MbId',
              onEdit: field => {
                field.editEnabled = true;
              },
              onOk: field => {
                field.editEnabled = false;
                SongEntity.findOneBy({ id: this.songId }).then(song => {
                  song.mbId = this.entityEditorModel.data['mbId'];
                  song.save();
                });
              }
            }
          ]
        }
      ]
    };
  }

  private initializeNavbar(): void {
    const favorite = this.entityEditorModel.data['favorite'] as boolean;
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Open Directory',
          icon: AppAttributeIcons.DirectoryOpen,
          action: () => {
            const song = this.entityEditorModel.data as ISongModel;
            const directoryPath = this.fileService.getDirectoryPath(song.filePath);
            this.fileService.openDirectory(directoryPath);
          }
        },
        {
          caption: 'Toggle Labels',
          icon: AppAttributeIcons.Labels,
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
        icon:  AppEntityIcons.Song
      },
      rightIcons: new IconActionArray(...[{
        icon: AppAttributeIcons.FavoriteOn,
        action: iconAction => {
          this.entityService.setFavoriteSong(this.songId, false).then(response => {
            iconAction.off = true;
            this.events.broadcast(AppEvent.ViewSongUpdated, response);
          });
        },
        offIcon: AppAttributeIcons.FavoriteOff,
        offAction: iconAction => {
          this.entityService.setFavoriteSong(this.songId, true).then(response => {
            iconAction.off = false;
            this.events.broadcast(AppEvent.ViewSongUpdated, response);
          });
        },
        off: !favorite
      }])
    });
  }

  private async editLanguage(): Promise<void> {
    const entries = await ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Language.id });
    const valuePairs = entries.map(entry => {
      const valuePair: ISelectableValue = {
        value: entry.id,
        caption: entry.name
      };
      if (entry.name === this.entityEditorModel.data['language']) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Language',
      titleIcon: AppAttributeIcons.Language,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: valuePairs,
      onOk: model => {
        const selectedValues = model.items.filter(value => value.selected);
        const valuePair = selectedValues[0];
        if (valuePair.caption !== this.entityEditorModel.data['language']) {
          this.entityEditorModel.data['language'] = valuePair.caption;
          SongEntity.findOneBy({ id: this.entityEditorModel.data['id']}).then(song => {
            song.language = valuePair.caption;
            song.changeDate = new Date();
            song.save();
          });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
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
    const sortedEntries = this.utility.sort(entries, 'sequence');
    const valuePairs = sortedEntries.map(entry => {
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
      songClassification.songId = this.entityEditorModel.data['id'];
      songClassification.classificationId = valuePair.value;
      // We need this to get the type
      const classification = await ValueListEntryEntity.findOneBy({ id: songClassification.classificationId });
      songClassification.classificationTypeId = classification.valueListTypeId;
      // TODO: determine how to setup this one
      songClassification.primary = false;
      await songClassification.save();
    }
    else {
      await SongClassificationEntity.delete({ songId: this.entityEditorModel.data['id'], classificationId: valuePair.value})
    }
    await this.entityService.setChangeDate(this.entityEditorModel.data['id']);
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
