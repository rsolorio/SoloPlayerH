import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { SettingsViewStateService } from './settings-view-state.service';
import { ISettingCategory, clearSettingText } from 'src/app/shared/components/settings-base/settings-base.interface';
import { IconActionArray } from 'src/app/core/models/icon-action-array.class';
import { ActivatedRoute } from '@angular/router';
import { SettingsViewId } from './settings-view.enum';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IScanItemInfo, ISyncSongInfo } from 'src/app/sync-profile/scan/scan.interface';
import { AppEvent } from 'src/app/app-events';
import { IProcessDuration } from 'src/app/core/models/core.interface';
import { PlaylistEntity, SyncProfileEntity } from 'src/app/shared/entities';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { IMetadataWriterOutput } from 'src/app/mapping/data-transform/data-transform.interface';
import { IExportResult } from 'src/app/sync-profile/export/export.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { MetaField } from 'src/app/mapping/data-transform/data-transform.enum';
import { IFileInfo } from 'src/app/platform/file/file.interface';
import { AppViewIcons } from 'src/app/app-icons';

@Component({
  selector: 'sp-settings-view',
  templateUrl: './settings-view.component.html',
  styleUrls: ['./settings-view.component.scss']
})
export class SettingsViewComponent extends CoreComponent implements OnInit {
  public settingsInfo: ISettingCategory[];
  constructor(
    private utility: UtilityService,
    private navbarService: NavBarStateService,
    private loadingService: LoadingViewStateService,
    private stateService: SettingsViewStateService,
    private route: ActivatedRoute,
    private events: EventsService,
    private log: LogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    this.loadingService.show();
    let settingsViewId = this.utility.getRouteParam('viewId', this.route);
    const id = this.utility.getQueryParam('id', this.route);
    if (!settingsViewId) {
      settingsViewId = SettingsViewId.Main;
    }
    const context = await this.getContext(id, settingsViewId);
    this.settingsInfo = await this.stateService.getSettingsInfo(settingsViewId, context);
    this.stateService.refreshSettings(settingsViewId);
    this.subscribeToEvents(settingsViewId);
    this.initializeNavbar(this.utility.getQueryParam('title', this.route));
    this.loadingService.hide();
  }

  private initializeNavbar(title: string): void {
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Some Option'
        }
      ],
      title: title ? title : 'Settings',
      leftIcon: {
        icon: AppViewIcons.Settings
      },
      rightIcons: new IconActionArray()
    });
  }

  private async getContext(id: string, viewId: string): Promise<any> {
    switch (viewId) {
      case SettingsViewId.Main:
        return null;
      case SettingsViewId.Export:
      case SettingsViewId.ImportAudio:
      case SettingsViewId.ImportPlaylists:
        return await SyncProfileEntity.findOneBy({ id: id });
    }
    return null;
  }

  private subscribeToEvents(viewId: string): void {
    switch (viewId) {
      case SettingsViewId.Main:
        break;
      case SettingsViewId.Export:
        this.subscribeToExportEvents();
        break;
      case SettingsViewId.ImportAudio:
        this.subscribeToImportAudioEvents();
        break;
      case SettingsViewId.ImportPlaylists:
        this.subscribeToImportPlaylistEvents();
        break;
    }
  }

  private subscribeToImportAudioEvents(): void {
    this.subs.sink = this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanFile).subscribe(scanFileInfo => {
      if (scanFileInfo.scanId !== 'scanAudio') {
        return;
      }
      const setting = this.stateService.findSetting('syncAudioFiles', SettingsViewId.ImportAudio);
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      const html = `
        <span class="sp-text-medium">Calculating file count...</span><br>
        <span class="sp-text-small">Files found: ${scanFileInfo.progress}</span><br>
        <span class="sp-text-tiny">${scanFileInfo.item.directoryPath}</span><br>
        <span class="sp-text-tiny">${scanFileInfo.item.fullName}</span>
      `;
      setting.textHtml = html;
    });

    this.subs.sink = this.events.onEvent(AppEvent.ScanEnd).subscribe(scanId => {
      if (scanId !== 'scanAudio') {
        return;
      }
      const setting = this.stateService.findSetting('syncAudioFiles', SettingsViewId.ImportAudio);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
    });

    this.subs.sink = this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanAudioFileStart).subscribe(scanFileInfo => {
      const setting = this.stateService.findSetting('syncAudioFiles', SettingsViewId.ImportAudio);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      setting.disabled = true;
      setting.running = true;
      const html = `
        <span class="sp-text-medium">Reading metadata...</span><br>
        <span class="sp-text-small">File ${scanFileInfo.progress} of ${scanFileInfo.total}</span><br>
        <span class="sp-text-tiny">${scanFileInfo.item.directoryPath}</span><br>
        <span class="sp-text-tiny">${scanFileInfo.item.fullName}</span>
      `;
      setting.textHtml = html;
    });

    this.subs.sink = this.events.onEvent(AppEvent.ScanAudioDbSyncStart).subscribe(() => {
      const setting = this.stateService.findSetting('syncAudioFiles', SettingsViewId.ImportAudio);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Synchronizing changes...';
    });

    this.subs.sink = this.events.onEvent(AppEvent.ScanAudioDbCleanupStart).subscribe(() => {
      const setting = this.stateService.findSetting('syncAudioFiles', SettingsViewId.ImportAudio);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Cleaning up...';
    });

    this.subs.sink = this.events.onEvent<IProcessDuration<ISyncSongInfo>>(AppEvent.ScanAudioEnd).subscribe(processInfo => {
      const setting = this.stateService.findSetting('syncAudioFiles', SettingsViewId.ImportAudio);
      if (!setting) {
        return;
      }
      clearSettingText(setting);

      let syncMessage = '';
      if (processInfo.result.songAddedRecords.length) {
        syncMessage = `Added: ${processInfo.result.songAddedRecords.length}.`;
      }
      if (processInfo.result.songUpdatedRecords.length) {
        syncMessage += ` Updated: ${processInfo.result.songUpdatedRecords.length}.`;
      }
      if (processInfo.result.songSkippedRecords.length) {
        syncMessage += ` Skipped: ${processInfo.result.songSkippedRecords.length}.`;
      }
      if (processInfo.result.songDeletedRecords.length) {
        syncMessage += ` Deleted: ${processInfo.result.songDeletedRecords.length}.`;
      }
      if (processInfo.result.ignoredFiles.length) {
        syncMessage += ` Ignored: ${processInfo.result.ignoredFiles.length}`;
        this.log.warn('Ignored files', processInfo.result.ignoredFiles);
      }
      
      setting.textRegular[0] = 'Click here to start synchronizing audio files.';
      const errorFiles = processInfo.result.metadataResults.filter(r => r[MetaField.Error].length);
      if (errorFiles.length) {
        syncMessage += ` Errors: ${errorFiles.length}.`;
        setting.textWarning = `Sync process done. ${syncMessage}`;
        this.log.debug('Sync failures', errorFiles);
      }
      // TODO: report ignored files
      else {
        setting.textRegular[1] = `Sync process done. ${syncMessage}`;
      }

      setting.disabled = false;
      setting.running = false;
    });
  }

  private subscribeToImportPlaylistEvents(): void {
    this.subs.sink = this.events.onEvent<IScanItemInfo<IFileInfo>>(AppEvent.ScanFile).subscribe(scanFileInfo => {
      if (scanFileInfo.scanId !== 'scanPlaylists') {
        return;
      }
      const setting = this.stateService.findSetting('processPlaylists', SettingsViewId.ImportPlaylists);
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Scanning playlists...';
    });

    this.subs.sink = this.events.onEvent<IScanItemInfo<PlaylistEntity>>(AppEvent.ScanPlaylistCreated).subscribe(scanPlaylistInfo => {
      const setting = this.stateService.findSetting('processPlaylists', SettingsViewId.ImportPlaylists);
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[1] = `Playlist created: ${scanPlaylistInfo.progress}/${scanPlaylistInfo.total}: ${scanPlaylistInfo.item.name}`;
    });

    this.subs.sink = this.events.onEvent<IScanItemInfo<IPlaylistSongModel>>(AppEvent.ScanTrackAdded).subscribe(scanTrackInfo => {
      const setting = this.stateService.findSetting('processPlaylists', SettingsViewId.ImportPlaylists);
      if (!setting) {
        return;
      }
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[2] = `Track added: ${scanTrackInfo.progress} - ${scanTrackInfo.item.name} - ${scanTrackInfo.item.duration}`;
    });

    this.subs.sink = this.events.onEvent<IProcessDuration<ISyncSongInfo>>(AppEvent.ScanPlaylistEnd).subscribe(() => {
      const setting = this.stateService.findSetting('processPlaylists', SettingsViewId.ImportPlaylists);
      if (!setting) {
        return;
      }
      
      setting.textRegular[0] = 'Click here to start scanning playlists.';
      setting.textRegular[1] = 'Scan process done. No errors found.';
      setting.textRegular[2] = '';

      setting.disabled = false;
      setting.running = false;
    });
  }

  private subscribeToExportEvents(): void {
    this.subs.sink = this.events.onEvent(AppEvent.ExportStart).subscribe(() => {
      const setting = this.stateService.findSetting('exportLibrary', SettingsViewId.Export);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Preparing export...';
    });

    this.subs.sink = this.events.onEvent<IMetadataWriterOutput>(AppEvent.ExportAudioFileEnd).subscribe(exportAudioResult => {
      const setting = this.stateService.findSetting('exportLibrary', SettingsViewId.Export);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      const pathParts = exportAudioResult.destinationPath.split('\\');
      const fileName = pathParts[pathParts.length - 1];
      setting.disabled = true;
      setting.running = true;
      const html = `
        <span class="sp-text-medium">Exporting track ${exportAudioResult.count} to...</span><br>
        <span class="sp-text-tiny">${exportAudioResult.destinationPath.replace(fileName, '')}</span><br>
        <span class="sp-text-tiny">${fileName}</span>
      `;
      setting.textHtml = html;
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportSmartlistsStart).subscribe(exportResult => {
      const setting = this.stateService.findSetting('exportLibrary', SettingsViewId.Export);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Exporting smartlists to...';
      setting.textRegular[1] = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.textRegular[1] += '. Folder: ' + exportResult.playlistFolder;
      }
      setting.textRegular[2] = '';
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportAutolistsStart).subscribe(exportResult => {
      const setting = this.stateService.findSetting('exportLibrary', SettingsViewId.Export);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Exporting autolists...';
      setting.textRegular[1] = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.textRegular[1] += '. Folder: ' + exportResult.playlistFolder;
      }
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportPlaylistsStart).subscribe(exportResult => {
      const setting = this.stateService.findSetting('exportLibrary', SettingsViewId.Export);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      setting.disabled = true;
      setting.running = true;
      setting.textRegular[0] = 'Exporting playlists...';
      setting.textRegular[1] = 'Path: ' + exportResult.rootPath;
      if (exportResult.playlistFolder) {
        setting.textRegular[1] += '. Folder: ' + exportResult.playlistFolder;
      }
    });

    this.subs.sink = this.events.onEvent<IExportResult>(AppEvent.ExportEnd).subscribe(exportResult => {
      const setting = this.stateService.findSetting('exportLibrary', SettingsViewId.Export);
      if (!setting) {
        return;
      }
      clearSettingText(setting);
      let resultMessage = '';
      resultMessage += `Processed files: ${exportResult.totalFileCount}.`;
      resultMessage += ` Exported files: ${exportResult.finalFileCount}.`;
      resultMessage += ` Exported playlists: ${exportResult.playlistCount}.`;
      resultMessage += ` Exported smartlists: ${exportResult.smartlistCount}.`;
      resultMessage += ` Exported autolists: ${exportResult.autolistCount}.`;
      setting.disabled = false;
      setting.running = false;
      setting.textRegular[0] = 'Exporting process done.';
      setting.textRegular[1] = resultMessage;
      this.log.info('Export elapsed time: ' + this.utility.formatTimeSpan(exportResult.period.span), exportResult.period.span);
    });
  }
}
