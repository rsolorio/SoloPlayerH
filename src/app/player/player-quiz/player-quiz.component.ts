import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppActionIcons, AppAttributeIcons, AppFeatureIcons, AppPlayerIcons } from 'src/app/app-icons';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { IImage, ISelectableValue } from 'src/app/core/models/core.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { ImageService } from 'src/app/platform/image/image.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { RelatedImageEntity, SongEntity, SongExtendedViewEntity } from 'src/app/shared/entities';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { HtmlMediaEvent } from 'src/app/shared/services/html-player/html-player.enum';
import { LocalStorageService } from 'src/app/core/services/local-storage/local-storage.service';
import { Not } from 'typeorm';
import { IQuizCache } from './player-quiz.interface';
import { PlayerOverlayStateService } from '../player-overlay/player-overlay-state.service';

@Component({
  selector: 'sp-player-quiz',
  templateUrl: './player-quiz.component.html',
  styleUrls: ['./player-quiz.component.scss']
})
export class PlayerQuizComponent implements OnInit, OnDestroy {
  public AppPlayerIcons = AppPlayerIcons;
  public AppFeatureIcons = AppFeatureIcons;
  public AppAttributeIcons = AppAttributeIcons;
  public AppActionIcons = AppActionIcons;
  public RelatedImageSrc = RelatedImageSrc;

  // FIELDS
  public languageNameSearch: string;
  public genreSearch: string;
  public decadeSearch: number;
  public filePath: string;
  public imageSrc: string;
  public animatedImage = false;
  public songName: string;
  public artistName: string;
  public albumName: string;
  public releaseYear: number;
  public languageName: string;
  public genre: string;
  public decade: number;
  public elapsedTime: number = 0;
  public remainingTime: number = 0;
  public songInfoVisible = false;

  private htmlAudio = new Audio();
  private playTimer = null;
  private isReplacing = false;
  public isPlaying = false;
  private cache: IQuizCache;
  private cacheKey = 'sp.QuizCache'
  private stopAt = 0;

  constructor(
    private sidebarHostService: SideBarHostStateService,
    private db: DatabaseService,
    private entities: DatabaseEntitiesService,
    private utility: UtilityService,
    private imageService: ImageService,
    private navbarService: NavBarStateService,
    private localStorage: LocalStorageService,
    private playerOverlay: PlayerOverlayStateService,
    private log: LogService) { }

  ngOnInit(): void {
    this.subscribeToAudioEvents();
    const cacheData = this.localStorage.getByKey<IQuizCache>(this.cacheKey);
    if (cacheData) {
      this.cache = cacheData;
    }
    else {
      this.cache = {
        songs: []
      };
    }
    this.initializeNavBar();
    this.playerOverlay.hide();
  }

  ngOnDestroy(): void {
    this.playerOverlay.restore();
  }

  private refreshTitle() {
    const navbar = this.navbarService.getState();
    if (this.cache && this.cache.songs.length) {
      navbar.title = `Quiz (${this.cache.songs.length})`;
    }
    else {
      navbar.title = 'Quiz';
    }
  }

  public initializeNavBar() {
    this.refreshTitle();
    const navbar = this.navbarService.getState();
    navbar.mode = NavbarDisplayMode.Title;
    navbar.menuList = [{
      icon: AppActionIcons.Delete,
      caption: 'Clear History',
      action: () => {
        this.clearCache();
      }
    }];
  }

  private clearCache() {
    this.cache.songs = [];
    this.saveCache();
    this.refreshTitle();
  }

  public onLanguageEditClick() {
    this.criteriaEdit('language', this.languageNameSearch, 'Language', AppAttributeIcons.Language, [], value => this.languageNameSearch = value);
  }

  public onGenreEditClick() {
    this.criteriaEdit('genre', this.genreSearch, 'Genre', AppAttributeIcons.GenreName, ['Classical'], value => this.genreSearch = value);
  }

  public onDecadeEditClick() {
    this.criteriaEdit('releaseDecade', this.decadeSearch, 'Decade', AppAttributeIcons.Decade, [0], value => this.decadeSearch = value);
  }

  public onElapsedTimeClick() {
    const newTime = this.htmlAudio.currentTime - 10;
    if (newTime < 0) {
      this.htmlAudio.currentTime = 0;
    }
    else {
      this.htmlAudio.currentTime = newTime;
    }
  }

  public onRemainingTimeClick() {
    this.htmlAudio.currentTime += 30;
  }

  public onFindClick() {
    this.find();
  }

  public onClearClick() {
    this.languageNameSearch = null;
    this.genreSearch = null;
    this.decadeSearch = null;
    this.filePath = null;
    this.imageSrc = null;
    this.songName = null;
    this.artistName = null;
    this.albumName = null;
    this.releaseYear = null;
    this.languageName = null;
    this.genre = null;
    this.decade = null;
    this.elapsedTime = 0;
    this.remainingTime = 0;
    this.animatedImage = false;
    this.pause();
  }

  public onShowClick() {
    this.songInfoVisible = true;
  }

  public onPlayPause() {
    if (this.isPlaying) {
      this.pause()
    }
    else {
      this.play();
    }
  }

  public play10sec() {
    this.playPortion(10);
  }

  public play20sec() {
    this.playPortion(20);
  }

  public play30sec() {
    this.playPortion(30);
  }

  private replaceAudioSource() {
    this.htmlAudio.src = this.utility.fileToUrl(this.filePath);
    this.htmlAudio.load();
  }

  private async playPortion(secs: number): Promise<void> {
    if (this.filePath) {
      this.htmlAudio.currentTime = 0;
      this.stopAt = secs;
      await this.htmlAudio.play();
    }
  }

  private async play() {
    if (this.filePath) {
      this.songInfoVisible = true;
      await this.htmlAudio.play();
    }
  }

  private pause() {
    this.htmlAudio.pause();
  }

  private pauseAndReplaceAudioSource() {
    this.isReplacing = true;
    this.pause();
  }

  private saveCache() {
    this.localStorage.setByKey(this.cacheKey, this.cache);
  }

  private async criteriaEdit(columnName: string, currentValue: any, title: string, icon: string, excludeValues: any[], onOk: (value) => void) {
    const criteria = new Criteria();
    criteria.paging.distinct = true;
    criteria.addSorting(columnName);
    let results = await this.db.getColumnValues(SongEntity, criteria, { expression: columnName });
    if (excludeValues && excludeValues.length) {
      for (const excludeValue of excludeValues) {
        results = results.filter(item => item[columnName] !== excludeValue);
      }
    }
    const valuePairs = results.map(result => {
      const valuePair: ISelectableValue = {
        value: result[columnName],
        caption: result[columnName]
      };
      if (result[columnName] === currentValue) {
        valuePair.selected = true;
      }
      return valuePair;
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: title,
      titleIcon: icon,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: valuePairs,
      onOk: model => {
        const selectedValues = model.items.filter(value => value.selected);
        const valuePair = selectedValues[0];
        onOk(valuePair.value);
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }

  private async findSong(): Promise<SongExtendedViewEntity> {
    const criteria = new Criteria();
    criteria.random = true;
    if (this.languageNameSearch) {
      criteria.searchCriteria.push(new CriteriaItem('language', this.languageNameSearch));
    }
    if (this.genreSearch) {
      criteria.searchCriteria.push(new CriteriaItem('genre', this.genreSearch));
    }
    else {
      // Ignore classical music; also ignored in the genre list
      criteria.searchCriteria.push(new CriteriaItem('genre', 'Classical', CriteriaComparison.NotEquals));
    }
    if (this.decadeSearch) {
      criteria.searchCriteria.push(new CriteriaItem('releaseDecade', this.decadeSearch));
    }
    else {
      // Ignore music with no decade; also ignored in the decade list
      criteria.searchCriteria.push(new CriteriaItem('releaseDecade', 0, CriteriaComparison.NotEquals));
    }
    // Ignore "bad" music
    criteria.searchCriteria.push(new CriteriaItem('rating', 2, CriteriaComparison.GreaterThan));
    const songs = await this.db.getList(SongExtendedViewEntity, criteria);
    // Get a song that is not part of the cache
    if (songs.length) {
      for (const song of songs) {
        const matchingSong = this.cache.songs.find(songId => songId === song.id);
        if (!matchingSong) {
          this.cache.songs.push(song.id);
          this.saveCache();
          this.refreshTitle();
          return song;
        }
      }
    }
    return null;
  }

  private async find() {
    this.songInfoVisible = false;
    const song = await this.findSong();

    if (!song) {
      // TODO: song not found message
      this.log.info('Song not found.');
      return;
    }

    let image: IImage;
    const animatedImages = await RelatedImageEntity.findBy({ relatedId: song.primaryAlbumId, imageType: MusicImageType.FrontAnimated });
    if (animatedImages.length) {
      image = await this.imageService.getImageFromSource(animatedImages[0]);
      this.animatedImage = true;
      this.log.info('Animated image found.');
    }
    else {
      this.animatedImage = false;
      const songImages = await RelatedImageEntity.findBy({ relatedId: song.id });
      if (songImages.length) {
        image = await this.imageService.getImageFromSource(songImages[0]);
        this.log.info('Single image found.');
      }
      else {
        const albumImages = await RelatedImageEntity.findBy({ relatedId: song.primaryAlbumId, imageType: Not(MusicImageType.FrontAnimated) });
        if (albumImages.length) {
          image = await this.imageService.getImageFromSource(albumImages[0]);
          this.log.info('Album image found.');
        }
        else {
          this.log.warn('No image found.');
        }
      }
    }
    if (image) {
      this.imageSrc = image.src;
    }
    const artists = await (await this.entities.prepareScrobbleRequest(song.id)).artistName;
    this.log.table('Song found:', { tabular: {
      name: song.name,
      cleanName: song.cleanName,
      albumArtist: song.primaryArtistName,
      artist: artists,
      album: song.primaryAlbumStylized,
      year: song.releaseYear
    } });
    this.filePath = song.filePath;
    this.songName = song.cleanName;
    this.artistName = artists;
    this.albumName = song.primaryAlbumStylized;
    this.releaseYear = song.releaseYear;
    this.languageName = song.language;
    this.genre = song.genre;
    this.decade = song.releaseDecade;
    this.elapsedTime = 0;
    this.remainingTime = song.seconds;

    if (this.isPlaying) {
      this.pauseAndReplaceAudioSource();
    }
    else {
      this.replaceAudioSource();
    }
  }

  private subscribeToAudioEvents() {
    this.htmlAudio.addEventListener(HtmlMediaEvent.Playing, () => {
      this.restartPlayTimer();
      this.isPlaying = true;
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Pause, () => {
      this.cancelPlayTimer();
      this.isPlaying = false;

      if (this.isReplacing) {
        this.replaceAudioSource();
        this.isReplacing = false;
      }
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Ended, () => {
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Stops, () => {
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Error, (errorInfo) => {
    });
  }

  private cancelPlayTimer() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  private restartPlayTimer() {
    this.cancelPlayTimer();

    this.playTimer = setInterval(() => {
      this.elapsedTime = this.htmlAudio.currentTime;
      if (this.elapsedTime > this.stopAt && this.stopAt > 0) {
        this.pause();
        this.stopAt = 0;
      }
    }, 1000);
  }

}
