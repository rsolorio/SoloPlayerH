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
import { IEventArgs } from '../core/models/core.interface';
import { IPlaylistSongModel } from '../shared/models/playlist-song-model.interface';
import { DatabaseService } from '../shared/services/database/database.service';
import { ISongModel } from '../shared/models/song-model.interface';
import { DialogService } from '../platform/dialog/dialog.service';
import { UtilityService } from '../core/services/utility/utility.service';
import { ValueListSelectorService } from '../value-list/value-list-selector/value-list-selector.service';
import { IValueListSelectorModel, ValueListSelectMode } from '../value-list/value-list-selector/value-list-selector-model.interface';
import { ValueLists } from '../shared/services/database/database.lists';
import { ImagePreviewService } from '../related-image/image-preview/image-preview.service';
import { RelatedImageEntity } from '../shared/entities';
import { RelatedImageId } from '../shared/services/database/database.images';
import { ImageService } from '../platform/image/image.service';

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
  public images: RelatedImageEntity[] = [];
  public selectedImageIndex = -1;

  constructor(
    private playerServiceBase: HtmlPlayerService,
    private playerOverlayServiceBase: PlayerOverlayStateService,
    private eventService: EventsService,
    private menuServiceBase: MenuService,
    private database: DatabaseService,
    private dialogService: DialogService,
    private utilityService: UtilityService,
    private imagePreviewService: ImagePreviewService,
    private valueListSelectorService: ValueListSelectorService,
    private imageSvc: ImageService)
  {
    super();
  }

  public get song(): ISongModel {
    return this.model.playerList.current.song;
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
      this.setupAssociatedData(this.model.playerList.current.song);
    }
    this.subs.sink = this.eventService.onEvent<IEventArgs<IPlaylistSongModel>>(AppEvent.PlaylistCurrentTrackChanged).subscribe(eventArgs => {
      this.onTrackChanged(eventArgs);
    });
  }

  protected initializeMenu() {
    // TODO: this should not be displayed in cordova mode
    this.menuList.push({
      caption: 'Mobile Size',
      icon: 'mdi-cellphone mdi',
      action: () => {
        this.dialogService.resizeWindow(this.utilityService.getSmallFormFactor());
      }
    });
    this.menuList.push({
      caption: 'Screenshot',
      icon: 'mdi-image-outline mdi',
      action: () => {
        this.takeScreenshot();
      }
    });
  }

  protected onTrackChanged(eventArgs: IEventArgs<IPlaylistSongModel>): void {
    this.setupAssociatedData(eventArgs.newValue.song);
  }

  /**
   * Setups any data associated with the specified song.
   * @param songId 
   */
  protected async setupAssociatedData(song: ISongModel): Promise<void> {
    await this.setupImages(song);
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

  public onForward() {
    this.playerServiceBase.playNext();
  }

  public onFavoriteClick(song: ISongModel) {
    const newValue = !song.favorite;
    this.database.setFavoriteSong(song.id, newValue).then(() => {
      song.favorite = newValue;
    });
  }

  public onMoodClick(song: ISongModel): void {
    const selectedValues: string[] = [];
    if (song.mood) {
      selectedValues.push(song.mood);
    }
    const valueListModel: IValueListSelectorModel = {
      title: 'Mood',
      titleIcon: 'mdi-emoticon-happy-outline mdi',
      subTitle: song.name,
      subTitleIcon: 'mdi-music-note mdi',
      valueListTypeId: ValueLists.Mood.id,
      selectMode: ValueListSelectMode.Quick,
      selectedValues: selectedValues,
      onOk: selectedEntries => {
        if (selectedEntries && selectedEntries.length) {
          const newMood = selectedEntries[0].name;
          this.database.setMood(song.id, newMood).then(() => {
            song.mood = newMood;
          });
        }
      }
    };
    this.valueListSelectorService.show(valueListModel);
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
    this.database.setRating(song.id, song.rating);
  }

  public takeScreenshot(): void {
    this.imageSvc.getScreenshot(300).then(result => {
      this.imagePreviewService.show({
        title: 'Screenshot',
        subTitle: 'Now Playing',
        src: result
      });
    });
  }

  public getExtension(): string {
    // TODO: save extension in table
    if (this.model.playerList.current.song.filePath) {
      const fileParts = this.model.playerList.current.song.filePath.split('.');
      return fileParts[fileParts.length - 1].toUpperCase();
    }
    return null;
  }

  public getBitrate(): string {
    if (this.model.playerList.current.song.vbr) {
      return 'VBR';
    }
    const kbps = this.model.playerList.current.song.bitrate / 1000;
    return kbps + 'Kbps';
  }

  public getFrequency(): string {
    const khz = this.model.playerList.current.song.frequency / 1000;
    return khz + 'KHz';
  }

  public getSize(): string {
    const mb = this.model.playerList.current.song.fileSize / 1000 / 1000;
    return this.utilityService.round(mb, 2) + 'Mb';
  }
}