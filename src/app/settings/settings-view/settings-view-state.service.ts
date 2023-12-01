import { Injectable } from '@angular/core';
import { IStateService, KeyValuesGen } from 'src/app/core/models/core.interface';
import { FilterId, ModuleOptionId } from 'src/app/shared/services/database/database.seed';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { PlaylistEntity, SongEntity } from 'src/app/shared/entities';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppFeatureIcons, AppViewIcons } from 'src/app/app-icons';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { AppRoute, appRoutes } from 'src/app/app-routes';
import { DialogService } from 'src/app/platform/dialog/dialog.service';
import { AppTestService } from 'src/app/app-test';
import { LocalStorageService } from 'src/app/shared/services/local-storage/local-storage.service';
import { LocalStorageKeys } from 'src/app/shared/services/local-storage/local-storage.enum';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ISetting, ISettingCategory } from 'src/app/shared/components/settings-base/settings-base.interface';
import { SettingsEditorType } from 'src/app/shared/components/settings-base/settings-base.enum';
import { SettingsViewId } from './settings-view.enum';
import { ISyncProfile } from 'src/app/shared/models/sync-profile-model.interface';
import { IExportConfig } from 'src/app/sync-profile/export/export.interface';
import { IChipItem } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { MpegTagVersion } from 'src/app/shared/models/music.enum';
import { In } from 'typeorm';
import { ExportService } from 'src/app/sync-profile/export/export.service';
import { ScanService } from 'src/app/sync-profile/scan/scan.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsViewStateService implements IStateService<KeyValuesGen<ISettingCategory>> {
  private state: KeyValuesGen<ISettingCategory> = {};
  constructor(
    private options: DatabaseOptionsService,
    private utility: UtilityService,
    private entities: DatabaseEntitiesService,
    private db: DatabaseService,
    private dialog: DialogService,
    private tester: AppTestService,
    private storage: LocalStorageService,
    private navigation: NavigationService,
    private exporter: ExportService,
    private scanner: ScanService)
  {
  }

  public getState(): KeyValuesGen<ISettingCategory> {
    return this.state;
  }

  public async getSettingsInfo(viewId: string, context?: any): Promise<ISettingCategory[]> {
    if (!this.state[viewId]) {
      switch (viewId) {
        case SettingsViewId.Main:
          this.state[viewId] = this.buildMainSettings();
          break;
        case SettingsViewId.Export:
          this.state[viewId] = await this.buildExportSettings(context);
          break;
        case SettingsViewId.ImportAudio:
          this.state[viewId] = this.buildImportAudioSettings(context);
          break;
        case SettingsViewId.ImportPlaylists:
          this.state[viewId] = this.buildImportPlaylistsSettings(context);
          break;
      }
    }
    return this.state[viewId];
  }

  private buildMainSettings(): ISettingCategory[] {
    const settings: ISettingCategory[] = [
      {
        name: 'Media Library',
        settings: [
          {
            id: 'statistics',
            name: 'Statistics',
            icon: AppFeatureIcons.Statistics
          },
          {
            name: 'Export Data',
            icon: AppActionIcons.ExportData,
            textRegular: ['Export data into a json file.'],
            action: setting => {
              setting.running = true;
              this.entities.exportColorSelectionData().then(data => {
                this.utility.downloadJson(data, 'sp-backup.json');
                setting.running = false;
              });
            }
          },
          {
            name: 'Purge Database',
            icon: AppActionIcons.DeleteData,
            textRegular: ['Deletes all data and recreates the database.'],
            action: setting => {
              setting.disabled = true;
              setting.running = true;
              this.db.purge().then(() => {
                this.options.init().then(() => {
                  setting.running = false;
                  setting.disabled = false;
                });
              });
            }
          }
        ]
      },
      {
        name: 'Audio Synchronization',
        settings: [
          {
            name: 'Profiles',
            icon: AppEntityIcons.Sync,
            textRegular: ['Configuration and execution for all import/export tasks.'],
            action: () => {
              this.navigation.forward(appRoutes[AppRoute.SyncProfiles].route);
            }
          },
          {
            name: 'Multiple Artists',
            icon: AppFeatureIcons.MultipleArtists,
            textRegular: [
              'This feature will take artist tags and split every value by using separators. Click here to specify separators. Leave it empty to disable the feature.'
            ]
          },
          {
            name: 'Multiple Genres',
            icon: AppFeatureIcons.MultipleGenres,
            textRegular: [
              'This feature will take genre tags and split every value by using separators. Click here to specify separators. Leave it empty to disable the feature.'
            ]
          },
          {
            name: 'Force File Sync',
            icon: AppActionIcons.FileSync,
            editorType: SettingsEditorType.YesNo,
            textRegular: [
              'By default, the scan process only re-syncs information from existing files with a new modification date. When this flag is on, the process will sync information from all existing files; this process is slower but ensrures all metadata is up to date and synchronized to the database; turn this flag on when file lyrics have changed or when the default scan does not detect changes.'
            ],
            data: this.options.getBoolean(ModuleOptionId.ForceFileSync),
            onChange: setting => {
              this.options.saveBoolean(ModuleOptionId.ForceFileSync, setting.data);
            }
          }
        ]
      },
      {
        name: 'Navigation',
        settings: [
          {
            name: 'Hide NavBar On Scroll',
            icon: AppActionIcons.Scroll,
            editorType: SettingsEditorType.YesNo,
            textRegular: ['Automatically hide the navbar when scrolling down; this will give more vertical space to the lists. To show the navbar just scroll up.'],
            data: this.options.getBoolean(ModuleOptionId.HideNavbarOnScroll),
            onChange: setting => {
              this.options.saveBoolean(ModuleOptionId.HideNavbarOnScroll, setting.data);
            }
          },
          {
            id: 'multipleQuickFilters',
            name: 'Multiple Quick Filters',
            icon: AppFeatureIcons.MultipleFilters,
            editorType: SettingsEditorType.YesNo,
            textRegular: [
              'If turned off, the quick filter panel will allow to select one filter at a time; as soon as you click the filter the change will be applied.',
              'If turned on, the quick filter panel will allow to select multiple filters; you need to click OK to apply the changes.'
            ],
            data: this.options.getBoolean(ModuleOptionId.AllowMultipleQuickFilters),
            onChange: setting => {
              this.options.saveBoolean(ModuleOptionId.AllowMultipleQuickFilters, setting.data);
            }
          },
          {
            name: 'Include Associated Artists',
            icon: AppAttributeIcons.ArtistGroup,
            editorType: SettingsEditorType.YesNo,
            textRegular: [
              'If turned on, clicking an artist will display not only its associated songs but also songs associated with contributors and singers.'
            ],
            data: this.options.getBoolean(ModuleOptionId.IncludeAssociatedArtistSongs),
            onChange: setting => {
              this.options.saveBoolean(ModuleOptionId.IncludeAssociatedArtistSongs, setting.data);
            }
          },
          {
            name: 'List View Limit',
            icon: AppAttributeIcons.Top,
            editorType: SettingsEditorType.Number,
            textRegular: ['The maximum number of results to be displayed in the views.'],
            data: this.options.getNumber(ModuleOptionId.ListViewLimit),
            textData: [this.options.getNumber(ModuleOptionId.ListViewLimit).toString()],
            onChange: setting => {
              setting.textData = [setting.data.toString()];
              this.options.saveNumber(ModuleOptionId.ListViewLimit, parseInt(setting.data.toString(), 10));
            }
          }
        ]
      },
      {
        name: 'Player',
        settings: [
          {
            name: 'Replay Time',
            icon: AppActionIcons.TimeBackward,
            textRegular: ['Amount of time in seconds to go back when replaying a track.'],
            data: this.options.getNumber(ModuleOptionId.PlayerReplayTime),
            textData: [this.options.getNumber(ModuleOptionId.PlayerReplayTime).toString()]
          },
          {
            name: 'Forward Time',
            icon: AppActionIcons.TimeForward,
            textRegular: ['Amount of time in seconds to go forward when playing a track.'],
            data: this.options.getNumber(ModuleOptionId.PlayerForwardTime),
            textData: [this.options.getNumber(ModuleOptionId.PlayerForwardTime).toString()]
          },
          {
            name: 'Play Percentage',
            icon: AppActionIcons.PlusOne,
            textRegular: ['Minimum elapsed percentage to mark a song as played.'],
            data: this.options.getNumber(ModuleOptionId.PlayPercentage),
            textData: [this.options.getNumber(ModuleOptionId.PlayPercentage).toString()]
          }
        ]
      },
      {
        name: 'Appearance',
        settings: [
          {
            // TODO: this should not be displayed in cordova mode
            name: 'Small Form Factor',
            icon: AppFeatureIcons.Mobile,
            textRegular: ['Resizes the window to a mobile form factor.'],
            action: () => {
              this.dialog.resizeWindow(this.utility.getSmallFormFactor());
            }
          }
        ]
      },
      {
        name: 'Developer Options',
        settings: [
          {
            name: 'Dev Tools',
            icon: AppActionIcons.Code,
            textRegular: ['Open developer tools.'],
            action: () => {
              this.dialog.openDevTools();
            }
          },
          {
            id: 'debugMode',
            name: 'Debug',
            icon: AppActionIcons.Debug,
            textRegular: ['Click here to turn on or off debug mode.'],
            editorType: SettingsEditorType.YesNo,
            data: this.storage.getByKey(LocalStorageKeys.DebugMode),
            onChange: setting => {
              setting.running = true;
              this.storage.setByKey(LocalStorageKeys.DebugMode, setting.data);
              this.utility.reloadApp();
            }
          },
          {
            name: 'Test',
            icon: AppActionIcons.Test,
            textRegular: ['Action for testing purposes.'],
            action: () => {
              this.tester.test();
            }
          }
        ]
      },
      {
        name: 'About',
        settings: [
          {
            name: 'Version',
            icon: AppViewIcons.About,
            textRegular: [this.utility.getAppVersion()]
          }
        ]
      }
    ];
    return settings;
  }

  private async buildExportSettings(profile: ISyncProfile): Promise<ISettingCategory[]> {
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const exportConfig = parsedProfile.configObj as IExportConfig;
    const settings: ISettingCategory[] = [
      {
        name: 'General',
        settings: [
          {
            id: 'exportLibrary',
            name: 'Run',
            icon: AppActionIcons.Run,
            textRegular: ['Click here to start running the export process.'],
            action: () => {
              this.exporter.run(profile.id);
            }
          },
          {
            name: 'Directory',
            icon: AppAttributeIcons.Directory,
            textRegular: ['Directory where audio and playlist files will be exported.'],
            textData: parsedProfile.directoryArray,
            data: parsedProfile.directoryArray
          },
          {
            name: 'Last Songs Added',
            icon: AppAttributeIcons.AddDate,
            textRegular: [
              'This number represents the last songs added to the library that will be exported.',
              'If this value is greater than zero, exporting static playlists will be disabled.'],
            editorType: SettingsEditorType.Number,
            data: exportConfig.lastAdded,
            textData: [exportConfig.lastAdded ? exportConfig.lastAdded.toString() : '0'],
            beforePanelOpen: async panelModel => {
              panelModel['label'] = 'Last number of songs';
            },
            onChange: setting => {
              exportConfig.lastAdded = parseInt(setting.data.toString(), 10);
              setting.textData = [exportConfig.lastAdded ? exportConfig.lastAdded.toString() : '0'];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Mpeg Tag Version',
            icon: AppFeatureIcons.TagMapping,
            textRegular: ['The ID3 tag version to be used when writing the audio metadata. This setting only applies to mp3 files.'],
            editorType: SettingsEditorType.List,
            textData: [exportConfig.mpegTag],
            beforePanelOpen: async panelModel => {
              const chipItem1: IChipItem = { sequence: 1, value: MpegTagVersion.Id3v23, caption: MpegTagVersion.Id3v23 };
              if (chipItem1.value === exportConfig.mpegTag) {
                chipItem1.selected = true;
              }
              const chipItem2: IChipItem = { sequence: 2, value: MpegTagVersion.Id3v24, caption: MpegTagVersion.Id3v24 };
              if (chipItem2.value === exportConfig.mpegTag) {
                chipItem2.selected = true;
              }
              panelModel['items'] = [chipItem1, chipItem2];
            },
            onChange: setting => {
              exportConfig.mpegTag = setting.data;
              setting.textData = [setting.data];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          }
        ]
      },
      {
        name: 'Playlist Settings',
        settings: [
          {
            name: 'Export Static Playlists',
            icon: AppEntityIcons.Playlist,
            textRegular: ['Whether or not all static playlists should be exported.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.playlistsDisabled,
            disabled: exportConfig.lastAdded > 0,
            onChange: setting => {
              exportConfig.playlistConfig.playlistsDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            id: 'exportSelectedPlaylists',
            name: 'Export Selected Playlists',
            icon: AppEntityIcons.Playlist,
            textRegular: ['Select playlists to export'],
            editorType: SettingsEditorType.ListMultiple,
            data: exportConfig.playlistConfig?.ids,
            beforePanelOpen: async panelModel => {
              const playlists = await PlaylistEntity.find();
              const chips: IChipItem[] = [];
              this.utility.sort(playlists, 'name').forEach(playlist => {
                chips.push({
                  value: playlist.id,
                  caption: playlist.name,
                  selected: exportConfig.playlistConfig?.ids?.length && exportConfig.playlistConfig.ids.includes(playlist.id)
                })
              });
              panelModel['items'] = chips;
            },
            onChange: settings => {
              if (!exportConfig.playlistConfig) {
                exportConfig.playlistConfig = {};
              }
              exportConfig.playlistConfig.ids = settings.data;
              this.entities.saveSyncProfile(parsedProfile).then(result => {
                profile.config = result.config;
                this.getPlaylistNames(exportConfig.playlistConfig.ids).then(names => {
                  settings.textData = [names];
                });
              });
            }
          },
          {
            name: 'Export Smart Playlists',
            icon: AppEntityIcons.Smartlist,
            textRegular: ['Whether or not smart playlists should be exported.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.smartlistsDisabled,
            onChange: setting => {
              exportConfig.playlistConfig.smartlistsDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Export Auto Playlists',
            icon: AppEntityIcons.Autolist,
            textRegular: ['Whether or not auto playlists should be exported.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.autolistsDisabled,
            onChange: setting => {
              exportConfig.playlistConfig.autolistsDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Dedicated Playlist Folder',
            icon: AppAttributeIcons.PlaylistDirectory,
            textRegular: ['Whether or not playlist files should be saved on its own playlist folder.'],
            editorType: SettingsEditorType.YesNo,
            data: !exportConfig.playlistConfig.dedicatedDirectoryDisabled,
            onChange: setting => {
              exportConfig.playlistConfig.dedicatedDirectoryDisabled = !setting.data;
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Playlist Format',
            icon: AppAttributeIcons.FileInfo,
            textRegular: ['Select the playlist format to export.'],
            editorType: SettingsEditorType.List,
            data: exportConfig.playlistConfig.format,
            textData: [exportConfig.playlistConfig.format.toUpperCase()],
            beforePanelOpen: async panelModel => {
              const chipItemM3u: IChipItem = {
                sequence: 1, value: 'm3u', caption: 'M3U', selected: exportConfig.playlistConfig.format === 'm3u' };
              const chipItemPls: IChipItem = {
                sequence: 2, value: 'pls', caption: 'PLS', selected: exportConfig.playlistConfig.format === 'pls' };
              panelModel['items'] = [chipItemM3u, chipItemPls];
            },
            onChange: setting => {
              exportConfig.playlistConfig.format = setting.data;
              setting.textData = [exportConfig.playlistConfig.format.toUpperCase()];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Minimum Playlist Tracks',
            icon: AppAttributeIcons.Bottom,
            textRegular: ['The minimum number of tracks a playlist should have to be exported.'],
            editorType: SettingsEditorType.Number,
            data: exportConfig.playlistConfig.minCount,
            textData: [exportConfig.playlistConfig.minCount ? exportConfig.playlistConfig.minCount.toString() : '0'],
            beforePanelOpen: async panelModel => {
              panelModel['label'] = 'Minimum number of tracks';
            },
            onChange: setting => {
              exportConfig.playlistConfig.minCount = setting.data;
              setting.textData = [exportConfig.playlistConfig.minCount ? exportConfig.playlistConfig.minCount.toString() : '0'];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          },
          {
            name: 'Maximum Playlist Tracks',
            icon: AppAttributeIcons.Top,
            textRegular: ['The maximum number of tracks a playlist will have when exported.'],
            editorType: SettingsEditorType.Number,
            data: exportConfig.playlistConfig.maxCount,
            textData: [exportConfig.playlistConfig.maxCount ? exportConfig.playlistConfig.maxCount.toString() : '0'],
            beforePanelOpen: async panelModel => {
              panelModel['label'] = 'Maximum number of tracks';
            },
            onChange: setting => {
              exportConfig.playlistConfig.maxCount = setting.data;
              setting.textData = [exportConfig.playlistConfig.maxCount ? exportConfig.playlistConfig.maxCount.toString() : '0'];
              this.entities.saveSyncProfile(parsedProfile).then(result => profile.config = result.config);
            }
          }
        ]
      }
    ];

    const setting = this.findSettingItem('exportSelectedPlaylists', settings);
    const names = await this.getPlaylistNames(exportConfig.playlistConfig?.ids);
    setting.textData = [names];
    return settings;
  }

  private buildImportAudioSettings(profile: ISyncProfile): ISettingCategory[] {
    const settings: ISettingCategory[] = [
      {
        name: 'Actions',
        settings: [
          {
            id: 'syncAudioFiles',
            name: 'Run',
            icon: AppActionIcons.Run,
            textRegular: ['Click here to start the import audio process.'],
            action: () => {
              this.importAudio(profile);
            }
          },
          {
            name: 'Recently Added',
            icon: AppAttributeIcons.Recent,
            textRegular: ['Display recently added tracks.'],
            action: () => {
              this.entities.updateFilterAccessDate(FilterId.RecentlyAdded).then(() => {
                this.entities.getCriteriaFromFilterId(FilterId.RecentlyAdded).then(criteria => {
                  this.navigation.forward(AppRoute.Songs, { criteria: criteria });
                });
              });
            }            
          },
          {
            name: 'Recently Updated',
            icon: AppAttributeIcons.Recent,
            textRegular: ['Display recently updated tracks.'],
            action: () => {
              this.entities.updateFilterAccessDate(FilterId.RecentlyUpdated).then(() => {
                this.entities.getCriteriaFromFilterId(FilterId.RecentlyUpdated).then(criteria => {
                  this.navigation.forward(AppRoute.Songs, { criteria: criteria });
                });
              });
            }            
          }
        ]
      }
    ];
    return settings;
  }

  private buildImportPlaylistsSettings(profile: ISyncProfile): ISettingCategory[] {
    return null;
  }

  public async refreshSettings(viewId: string): Promise<void> {
    switch (viewId) {
      case SettingsViewId.Main:
        await this.refreshStatistics();
        break;
    }
  }

  private async refreshStatistics(): Promise<void> {
    let setting = this.findSetting('statistics', SettingsViewId.Main);
    const playlistCount = await PlaylistEntity.count();
    const songCount = await SongEntity.count();
    let hours = this.utility.secondsToHours(0);
    if (songCount) {
      const seconds = await this.entities.getSecondsSum();
      hours = this.utility.secondsToHours(seconds);
    }
    setting.textHtml = `
      Tracks: <span class="sp-color-primary sp-font-family-digital">${songCount}</span>
      <br>
      Playlists: <span class="sp-color-primary sp-font-family-digital">${playlistCount}</span>
      <br>
      Playing time: <span class="sp-color-primary sp-font-family-digital">${hours}</span>
    `;
  }

  public findSetting(id: string, viewId: string): ISetting {
    return this.findSettingItem(id, this.state[viewId]);
  }

  private findSettingItem(id: string, categories: ISettingCategory[]): ISetting {
    for (const settingCategory of categories) {
      for (const setting of settingCategory.settings) {
        if (setting.id === id) {
          return setting;
        }
      }
    }
    return null;
  }

  private async getPlaylistNames(ids: string[]): Promise<string> {
    if (ids?.length) {
      const playlists = await PlaylistEntity.findBy({ id: In(ids) });
      return playlists.map(p => p.name).join(', ');
    }
    return null;
  }

  private async importAudio(profile: ISyncProfile): Promise<void> {
    profile.running = true;
    const parsedProfile = this.entities.parseSyncProfile(profile);
    const syncResponse = await this.scanner.scanAndSyncAudio(parsedProfile.directoryArray, '.mp3', 'scanAudio');
    profile.running = false;
    // Log results
  }
}
