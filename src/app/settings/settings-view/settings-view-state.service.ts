import { Injectable } from '@angular/core';
import { IStateService } from 'src/app/core/models/core.interface';
import { ModuleOptionId } from 'src/app/shared/services/database/database.seed';
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

@Injectable({
  providedIn: 'root'
})
export class SettingsViewStateService implements IStateService<ISettingCategory[]> {
  private state: ISettingCategory[];
  constructor(
    private options: DatabaseOptionsService,
    private utility: UtilityService,
    private entities: DatabaseEntitiesService,
    private db: DatabaseService,
    private dialog: DialogService,
    private tester: AppTestService,
    private storage: LocalStorageService,
    private navigation: NavigationService)
  {
  }

  public getState(): ISettingCategory[] {
    return this.state;
  }

  /** Creates the list of settings. */
  public initializeState(): void {
    this.state = [
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
  }

  /** Update settings values. */
  public async updateState(): Promise<void> {
    await this.refreshStatistics();
  }

  private async refreshStatistics(): Promise<void> {
    let setting = this.findSetting('statistics');
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

  private findSetting(id: string): ISetting {
    for (const settingCategory of this.state) {
      for (const setting of settingCategory.settings) {
        if (setting.id === id) {
          return setting;
        }
      }
    }
    return null;
  }
}
