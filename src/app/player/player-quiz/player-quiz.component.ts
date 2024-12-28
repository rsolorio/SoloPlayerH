import { Component, OnInit } from '@angular/core';
import { AppActionIcons, AppAttributeIcons, AppFeatureIcons, AppPlayerIcons } from 'src/app/app-icons';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ISelectableValue } from 'src/app/core/models/core.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ChipDisplayMode, ChipSelectorType, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { SongEntity, SongExtendedViewEntity } from 'src/app/shared/entities';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';

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

  // FIELDS
  public languageName: string;
  public genre: string;
  public decade: number;
  public filePath: string;
  public imageSrc: string;
  public songName: string;
  public artistName: string;
  public albumName: string;
  public releaseYear: number;
  public elapsedTime: number = 0;
  public remainingTime: number = 0;

  constructor(
    private sidebarHostService: SideBarHostStateService,
    private db: DatabaseService,
    private entities: DatabaseEntitiesService,
    private utility: UtilityService,
    private log: LogService) { }

  ngOnInit(): void {
  }

  public onLanguageEditClick() {
    this.criteriaEdit('language', this.languageName, 'Language', AppAttributeIcons.Language, value => this.languageName = value);
  }

  public onGenreEditClick() {
    this.criteriaEdit('genre', this.genre, 'Genre', AppAttributeIcons.GenreName, value => this.genre = value);
  }

  public onDecadeEditClick() {
    this.criteriaEdit('releaseDecade', this.decade, 'Decade', AppAttributeIcons.Decade, value => this.decade = value);
  }

  public onFindClick() {
    this.find();
  }

  public onClearClick() {
    this.languageName = null;
    this.genre = null;
    this.decade = null;
    this.filePath = null;
    this.imageSrc = null;
    this.songName = null;
    this.artistName = null;
    this.albumName = null;
    this.releaseYear = null;
    this.elapsedTime = 0;
    this.remainingTime = 0;
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
    const criteria = new Criteria();
    criteria.paging.pageSize = 1;
    criteria.random = true;
    if (this.languageName) {
      criteria.searchCriteria.push(new CriteriaItem('language', this.languageName));
    }
    if (this.genre) {
      criteria.searchCriteria.push(new CriteriaItem('genre', this.genre));
    }
    if (this.decade) {
      criteria.searchCriteria.push(new CriteriaItem('releaseDecade', this.decade));
    }
    const songs = await this.db.getList(SongExtendedViewEntity, criteria);

    if (songs.length) {
      const song = songs[0];
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
      this.elapsedTime = 0;
      this.remainingTime = song.seconds;
    }
    else {

    }


  }

}
