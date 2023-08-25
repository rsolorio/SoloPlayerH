import { OnInit, Directive } from '@angular/core';

import { IMenuModel } from '../core/models/menu-model.interface';
import { PlayerOverlayStateService } from './player-overlay/player-overlay-state.service';
import { CoreComponent } from '../core/models/core-component.class';
import { IPlayerState } from '../shared/models/player.interface';
import { PlayerStatus, PlayMode, RepeatMode } from '../shared/models/player.enum';
import { HtmlPlayerService } from '../shared/services/html-player/html-player.service';
import { MenuService } from '../core/services/menu/menu.service';
import { EventsService } from '../core/services/events/events.service';
import { AppEvent } from '../shared/models/events.enum';
import { IEventArgs, ISelectableValue } from '../core/models/core.interface';
import { IPlaylistSongModel } from '../shared/models/playlist-song-model.interface';
import { ISongModel } from '../shared/models/song-model.interface';
import { DialogService } from '../platform/dialog/dialog.service';
import { UtilityService } from '../core/services/utility/utility.service';
import { ValueLists } from '../shared/services/database/database.lists';
import { ArtistEntity, PartyRelationEntity, RelatedImageEntity, ValueListEntryEntity } from '../shared/entities';
import { RelatedImageId } from '../shared/services/database/database.seed';
import { ImageService } from '../platform/image/image.service';
import { PlayerOverlayMode } from './player-overlay/player-overlay.enum';
import { DatabaseEntitiesService } from '../shared/services/database/database-entities.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from '../shared/components/chip-selection/chip-selection-model.interface';
import { PartyRelationType } from '../shared/models/music.enum';
import { In } from 'typeorm';
import { DatabaseOptionsService } from '../shared/services/database/database-options.service';
import { ModuleOptionId } from '../shared/services/database/database.seed';
import { IImagePreviewModel } from '../related-image/image-preview/image-preview-model.interface';
import { ImagePreviewComponent } from '../related-image/image-preview/image-preview.component';
import { SideBarHostStateService } from '../core/components/side-bar-host/side-bar-host-state.service';
import { ChipSelectionComponent } from '../shared/components/chip-selection/chip-selection.component';
import { AppActionIcons, AppAttributeIcons, AppFeatureIcons, AppPlayerIcons } from '../app-icons';

/**
 * Base component for any implementation of the player modes.
 * Decorated with a directive just to allow the class use Angular features.
 */
@Directive()
// tslint:disable:directive-class-suffix
export class PlayerComponentBase extends CoreComponent implements OnInit {
  public model: IPlayerState;
  public menuList: IMenuModel[] = [];
  public PlayerStatus = PlayerStatus;
  public RepeatMode = RepeatMode;
  public PlayMode = PlayMode;
  public AppPlayerIcons = AppPlayerIcons;
  public AppFeatureIcons = AppFeatureIcons;
  public AppAttributeIcons = AppAttributeIcons;
  public images: RelatedImageEntity[] = [];
  public selectedImageIndex = -1;
  public contributors: string;

  constructor(
    private playerServiceBase: HtmlPlayerService,
    private playerOverlayServiceBase: PlayerOverlayStateService,
    private eventService: EventsService,
    private menuServiceBase: MenuService,
    private databaseEntityService: DatabaseEntitiesService,
    private dialogService: DialogService,
    private utilityService: UtilityService,
    private sidebarHostStateService: SideBarHostStateService,
    private imageSvc: ImageService,
    private optionsService: DatabaseOptionsService)
  {
    super();
  }

  public get song(): ISongModel {
    return this.model.playerList.current;
  }

  public get image(): RelatedImageEntity {
    if (this.selectedImageIndex >= 0 && this.images.length) {
      const relatedImage = this.images[this.selectedImageIndex];
      if (relatedImage.src) {
        return relatedImage;
      }
    }
    return null;
  }

  public ngOnInit() {
    this.onInit();
  }

  public onInit() {
    this.model = this.playerServiceBase.getState();
    this.initializeMenu();
    if (this.model.playerList.hasTrack()) {
      this.setupAssociatedData(this.model.playerList.current);
    }
    this.subs.sink = this.eventService.onEvent<IEventArgs<IPlaylistSongModel>>(AppEvent.PlaylistCurrentTrackChanged).subscribe(eventArgs => {
      this.onTrackChanged(eventArgs);
    });
  }

  protected initializeMenu() {
    // TODO: this should not be displayed in cordova mode
    this.menuList.push({
      caption: 'Toggle Explicit',
      icon: AppAttributeIcons.Explicit,
      action: () => {
      },
      actionTimeout: 300
    });
    this.menuList.push({ isSeparator: true });
    this.menuList.push({
      caption: 'Mobile Size',
      icon: AppFeatureIcons.Mobile,
      action: () => {
        this.dialogService.resizeWindow(this.utilityService.getSmallFormFactor());
      }
    });
    this.menuList.push({
      caption: 'Screenshot',
      icon: AppActionIcons.Screenshot,
      action: () => {
        this.takeScreenshot();
      },
      actionTimeout: 300
    });
  }

  protected onTrackChanged(eventArgs: IEventArgs<IPlaylistSongModel>): void {
    this.setupAssociatedData(eventArgs.newValue);
  }

  /**
   * Setups any data associated with the specified song.
   * @param songId 
   */
  protected async setupAssociatedData(song: ISongModel): Promise<void> {
    if (this.playerOverlayServiceBase.getState().mode === PlayerOverlayMode.Full) {
      await this.setupContributors(song.id);
      await this.setupImages(song);
    }
    else if (this.playerOverlayServiceBase.getState().mode === PlayerOverlayMode.Small) {
      // TODO: setup image for the current song
    }
  }

  protected async setupContributors(songId: string): Promise<void> {
    this.contributors = null;
    const relations = await PartyRelationEntity.findBy({ songId: songId, relationTypeId: PartyRelationType.Featuring });
    if (relations.length) {
      const artists = await ArtistEntity.findBy({ id: In(relations.map(r => r.relatedId ))});
      if (artists.length) {
        this.contributors = artists.map(a => a.artistStylized).join(', ');
      }
    }
  }

  protected async setupImages(song: ISongModel): Promise<void> {
    this.images = [];
    this.selectedImageIndex = -1;

    const songImages = await RelatedImageEntity.findBy({ relatedId: song.id });
    await this.setSrc(songImages);
    const albumImages = await RelatedImageEntity.findBy({ relatedId: song.primaryAlbumId });
    await this.setSrc(albumImages);
    const artistImages = await RelatedImageEntity.findBy({ relatedId: song.primaryArtistId });
    await this.setSrc(artistImages);
    this.images = [...songImages, ...albumImages, ...artistImages];
    if (!this.images.length) {
      const defaultImages = await RelatedImageEntity.findBy({ id: RelatedImageId.DefaultLarge });
      await this.setSrc(defaultImages);
      this.images = defaultImages;
    }
    if (this.images.length) {
      this.selectedImageIndex = 0;
    }
  }

  protected async setSrc(relatedImages: RelatedImageEntity[]): Promise<void> {
    for (const relatedImage of relatedImages) {
      const image = await this.imageSvc.getImageFromSource(relatedImage);
      relatedImage.src = image.src;
      relatedImage.srcType = image.srcType;
    }
  }

  protected getExtension(): string {
    // TODO: save extension in table
    if (this.model.playerList.current.filePath) {
      const fileParts = this.model.playerList.current.filePath.split('.');
      return fileParts[fileParts.length - 1];
    }
    return null;
  }

  protected getBitrate(): string {
    if (this.model.playerList.current.vbr) {
      return 'Vbr';
    }
    const kbps = this.model.playerList.current.bitrate / 1000;
    return kbps + 'Kbps';
  }

  protected getFrequency(): string {
    const khz = this.model.playerList.current.frequency / 1000;
    return khz + 'KHz';
  }

  protected getSize(): string {
    const mb = this.model.playerList.current.fileSize / 1000 / 1000;
    return this.utilityService.round(mb, 2) + 'Mb';
  }

  // Public Methods ****************************************************************************
  public onSongInfoClick() {
    if (this.model.playerList.hasTrack()) {
      this.playerOverlayServiceBase.expand();
    }
  }

  public onPlayPause() {
    this.playerServiceBase.togglePlay();
  }

  public onPrevious() {
    this.playerServiceBase.playPrevious(5);
  }

  public onNext() {
    this.playerServiceBase.playNext();
  }

  public onFavoriteClick(song: ISongModel) {
    const newValue = !song.favorite;
    this.databaseEntityService.setFavoriteSong(song.id, newValue).then(() => {
      song.favorite = newValue;
    });
  }

  public onMoodClick(song: ISongModel): void {
    ValueListEntryEntity.findBy({ valueListTypeId: ValueLists.Mood.id}).then(entries => {
      const values = entries.map(e => {
        const valuePair: ISelectableValue = {
          value: e.id,
          caption: e.name
        }
        if(valuePair.caption === song.mood) {
          valuePair.selected = true;
        }
        return valuePair;
      });
      const selectionModel: IChipSelectionModel = {
        componentType: ChipSelectionComponent,
        title: 'Mood',
        subTitle: song.name,
        type: ChipSelectorType.Quick,
        displayMode: ChipDisplayMode.Block,
        items: values,
        okHidden: true,
        onOk: model => {
          const selectedValues = model.items.filter(value => value.selected);
          if (selectedValues && selectedValues.length) {
            const newMood = selectedValues[0].caption;
            this.databaseEntityService.setMood(song.id, newMood).then(() => {
              song.mood = newMood;
            });
          }
        }
      };
      this.sidebarHostStateService.loadContent(selectionModel);
    });
  }

  public onTogglePlaylist() {
    this.model.playerList.isVisible = !this.model.playerList.isVisible;
  }

  public onCollapseClick() {
    this.beforeCollapse();
    this.menuServiceBase.hideSlideMenu();
    this.model.playerList.isVisible = false;
    this.playerOverlayServiceBase.restore();
  }

  protected beforeCollapse() {}

  public onRatingChange(e: IEventArgs<number>, song: ISongModel): void {
    if (e.oldValue === e.newValue) {
      return;
    }
    this.databaseEntityService.setRating(song.id, song.rating);
  }

  public takeScreenshot(): void {
    this.imageSvc.getScreenshot().then(result => {
      const imagePreviewModel: IImagePreviewModel = {
        title: 'Screenshot',
        subTitle: 'Now Playing',
        src: result,
        componentType: ImagePreviewComponent
      };
      this.sidebarHostStateService.loadContent(imagePreviewModel);
    });
  }

  public getFileInfo(): string {
    return `${this.getExtension()} · ${this.getBitrate()} · ${this.getFrequency()}`;
  }

  public adjustTimeDown(): void {
    const seconds = this.optionsService.getNumber(ModuleOptionId.PlayerReplayTime);
    if (seconds) {
      this.playerServiceBase.adjustTimeDown(seconds);
    }
  }

  public adjustTimeUp(): void {
    const seconds = this.optionsService.getNumber(ModuleOptionId.PlayerForwardTime);
    if (seconds) {
      this.playerServiceBase.adjustTimeUp(seconds);
    }
  }
}