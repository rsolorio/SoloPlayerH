import { Component, OnInit } from '@angular/core';
import { AppActionIcons, AppAttributeIcons, AppFeatureIcons, AppPlayerIcons } from 'src/app/app-icons';
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
import { Not } from 'typeorm';

@Component({
  selector: 'sp-player-quiz',
  templateUrl: './player-quiz.component.html',
  styleUrls: ['./player-quiz.component.scss']
})
export class PlayerQuizComponent implements OnInit {
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

  constructor(
    private sidebarHostService: SideBarHostStateService,
    private db: DatabaseService,
    private entities: DatabaseEntitiesService,
    private utility: UtilityService,
    private imageService: ImageService,
    private log: LogService) { }

  ngOnInit(): void {
    this.subscribeToAudioEvents();
  }

  public onLanguageEditClick() {
    this.criteriaEdit('language', this.languageNameSearch, 'Language', AppAttributeIcons.Language, value => this.languageNameSearch = value);
  }

  public onGenreEditClick() {
    this.criteriaEdit('genre', this.genreSearch, 'Genre', AppAttributeIcons.GenreName, value => this.genreSearch = value);
  }

  public onDecadeEditClick() {
    this.criteriaEdit('releaseDecade', this.decadeSearch, 'Decade', AppAttributeIcons.Decade, value => this.decadeSearch = value);
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
    this.utility.playPortion(this.filePath, 0, 10);
  }

  public play20sec() {
    this.utility.playPortion(this.filePath, 0, 20);
  }

  public play30sec() {
    this.utility.playPortion(this.filePath, 0, 30);
  }

  private replaceAudioSource() {
    this.htmlAudio.src = this.utility.fileToUrl(this.filePath);
    this.htmlAudio.load();
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

  private async criteriaEdit(columnName: string, currentValue: any, title: string, icon: string, onOk: (value) => void) {
    const criteria = new Criteria();
    criteria.paging.distinct = true;
    criteria.addSorting(columnName);
    const results = await this.db.getColumnValues(SongEntity, criteria, { expression: columnName });
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

  private async find() {
    this.songInfoVisible = false;
    const criteria = new Criteria();
    criteria.paging.pageSize = 1;
    criteria.random = true;
    if (this.languageNameSearch) {
      criteria.searchCriteria.push(new CriteriaItem('language', this.languageNameSearch));
    }
    if (this.genreSearch) {
      criteria.searchCriteria.push(new CriteriaItem('genre', this.genreSearch));
    }
    else {
      // Ignore classical music
      criteria.searchCriteria.push(new CriteriaItem('genre', 'Classical', CriteriaComparison.NotEquals));
    }
    if (this.decadeSearch) {
      criteria.searchCriteria.push(new CriteriaItem('releaseDecade', this.decadeSearch));
    }
    // Ignore "bad" music
    criteria.searchCriteria.push(new CriteriaItem('rating', 2, CriteriaComparison.GreaterThan));
    const songs = await this.db.getList(SongExtendedViewEntity, criteria);

    if (songs.length) {
      const song = songs[0];
      let image: IImage;
      const songImages = await RelatedImageEntity.findBy({ relatedId: song.id });
      if (songImages.length) {
        image = await this.imageService.getImageFromSource(songImages[0]);
      }
      else {
        const albumImages = await RelatedImageEntity.findBy({ relatedId: song.primaryAlbumId, imageType: Not(MusicImageType.FrontAnimated) });
        if (albumImages.length) {
          image = await this.imageService.getImageFromSource(albumImages[0]);
        }
      }
      if (image) {
        this.imageSrc = image.src;
      }
      const artists = await (await this.entities.prepareScrobbleRequest(song.id)).artistName;
      this.log.clearConsole();
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
    else {
      // TODO: song not found message
    }
  }

  private subscribeToAudioEvents() {
    this.htmlAudio.addEventListener(HtmlMediaEvent.TimeUpdate, () => {
      if (this.htmlAudio.currentTime) {
        // this.log.debug('timeupdate ' + this.htmlAudio.currentTime);
      }
      else {
      }
    });

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
    }, 1000);
  }

}
