import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerOverlayStateService } from 'src/app/player/player-overlay/player-overlay-state.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { PlayerSongStatus } from 'src/app/shared/models/player.enum';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { HtmlPlayerService } from 'src/app/shared/services/html-player/html-player.service';
import { SongListBroadcastService } from './song-list-broadcast.service';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { SongArtistViewEntity } from 'src/app/shared/entities';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { IBreadcrumbModel } from 'src/app/shared/components/breadcrumbs/breadcrumbs-model.interface';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { AppRoute, appRoutes } from 'src/app/app-routes';
import { Criteria, CriteriaItem, CriteriaItems } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison } from 'src/app/shared/services/criteria/criteria.enum';
import { SongBadge } from 'src/app/shared/models/music.enum';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { ModuleOptionId } from 'src/app/shared/services/database/database.seed';
import { ImageService } from 'src/app/platform/image/image.service';
import { IImage } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { IPlayerStatusChangedEventArgs } from 'src/app/shared/models/player.interface';
import { ImageSrcType } from 'src/app/core/models/core.enum';
import { RelatedImageSrc } from 'src/app/shared/services/database/database.seed';
import { PlayerListModel } from 'src/app/shared/models/player-list-model.class';
import { DatabaseOptionsService } from 'src/app/shared/services/database/database-options.service';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { IImagePreviewModel } from 'src/app/related-image/image-preview/image-preview-model.interface';
import { ImagePreviewComponent } from 'src/app/related-image/image-preview/image-preview.component';
import { AddToPlaylistService } from 'src/app/playlist/add-to-playlist/add-to-playlist.service';
import { INavbarModel, NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons, AppPlayerIcons } from 'src/app/app-icons';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { DbColumn } from 'src/app/shared/services/database/database.columns';
import { ChipDisplayMode, ChipSelectorType, IChipItem, IChipSelectionModel } from 'src/app/shared/components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from 'src/app/shared/components/chip-selection/chip-selection.component';
import { SyncType } from 'src/app/shared/models/sync-profile-model.interface';
import { ExportService } from 'src/app/sync-profile/export/export.service';
import { AppEvent } from 'src/app/app-events';
import { IPlaylistSongModel } from 'src/app/shared/models/playlist-song-model.interface';
import { LogService } from 'src/app/core/services/log/log.service';
import { ListBaseService } from 'src/app/shared/components/list-base/list-base.service';

@Component({
  selector: 'sp-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public PlayerSongStatus = PlayerSongStatus;
  public AppPlayerIcons = AppPlayerIcons;
  public AppAttributeIcons = AppAttributeIcons;
  public SongBadge = SongBadge;
  public songAttributesVisible = true;
  private expandPlayerOnPlay = false;

  // START - LIST MODEL
  public listModel: IListBaseModel = {
    listUpdatedEvent: AppEvent.SongListUpdated,
    itemMenuList: [
      {
        caption: 'Add to playlist',
        icon: 'mdi-playlist-plus mdi',
        action: (menuItem, param) => {
          const song = param as ISongModel;
          if (song) {
            this.addToPlaylistService.showPanel([song]);
          }
        }
      },
      {
        caption: 'Properties...',
        icon: AppActionIcons.Edit,
        action: (menuItem, param) => {
          const song = param as ISongModel;
          if (song) {
            this.navigation.forward(AppRoute.Songs, { routeParams: [song.id] });
          }
        }
      },
      {
        isSeparator: true
      },
      {
        caption: 'Search...',
        icon: AppActionIcons.WebSearch,
        action: (menuItem, param) => {
          const song = param as ISongModel;
          this.utility.googleSearch(`${song.primaryArtistName} ${song.name}`);
        }
      },
      {
        caption: 'Album Artist Songs',
        icon: AppEntityIcons.AlbumArtist,
        action: (menuItem, param) => {
          const song = param as ISongModel;
          this.setBreadcrumbsForAlbumArtistSongs(song);
        }
      },
      {
        caption: 'Feat. Artists Songs',
        icon: AppEntityIcons.Artist,
        action: (menuItem, param) => {
          const song = param as ISongModel;
          this.setBreadcrumbsForFeatArtistSongs(song);
        }
      },
      {
        caption: 'Album Songs',
        icon: AppEntityIcons.Album,
        action: (menuItem, param) => {
          const song = param as ISongModel;
          this.setBreadcrumbsForAlbumSongs(song);
        }
      }
    ],
    criteriaResult: {
      criteria: new Criteria('Search Results'),
      items: []
    },
    // Hide all icons by default and manage visibility on list updated
    rightIcons: [
      {
        id: 'sortIcon',
        icon: AppActionIcons.Sort,
        action: () => {
          this.openSortingPanel();
        },
        hidden: true
      },
      {
        id: 'quickFilterIcon',
        icon: AppActionIcons.Filter + ' sp-color-primary',
        action: () => {
          this.openQuickFilterPanel();
        },
        off: true,
        offIcon: AppActionIcons.Filter,
        offAction: () => {
          this.openQuickFilterPanel();
        },
        hidden: true
      },
      {
        id: 'filterRemoveIcon',
        icon: AppActionIcons.SmartlistRemove,
        action: iconAction => {
          // Since this icon is displayed in Title mode, all icons should be displayed in this mode
          this.navbarService.getState().rightIcons.forEach(i => i.hidden = false);
          // Except for this one
          iconAction.hidden = true;
          this.spListBaseComponent.send(new Criteria());
        },
        hidden: true
      },
      this.listBaseService.createSearchIcon('searchIcon')
    ],
    breadcrumbsEnabled: true,
    broadcastService: this.broadcastService,
    prepareItemRender: item => {
      const song = item as ISongModel;
      if (!song.recentIcon) {
        const days = this.utility.daysFromNow(new Date(song.addDate));
        song.recentIcon = this.spListBaseComponent.getRecentIcon(days);
      }

      // This has to run every time since this calculation is based on the current day      
      if (song.playDate) {
        const days = this.utility.daysFromNow(new Date(song.playDate));
        song.recentPlayIcon = this.playerOverlayService.getRecentPlayIcon(days);
      }
      else {
        song.recentPlayIcon = {
          styleClass: 'sp-no-display'
        };
      }

      // The song list has the responsibility of setting the proper image for each item
      // in the list
      if (!song.image.src && !song.image.getImage) {
        song.image.getImage = () => this.getSongImage(song);
      }

      // Set the proper player status
      if (song.id === this.playerService.getState().playerList.current.songId) {
        song.playerStatus = this.playerService.getState().playerList.current.playerStatus;
      }
    },
    onNavbarModeChanged: (model, navbar) => {
      this.listBaseService.handleIconsVisibility(model, navbar);
      this.manageRightIconsVisibility(model, navbar);
    }
  };
  // END - LIST MODEL

  constructor(
    public broadcastService: SongListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private menuService: MenuService,
    private playerService: HtmlPlayerService,
    private playerOverlayService: PlayerOverlayStateService,
    private events: EventsService,
    private db: DatabaseService,
    private options: DatabaseOptionsService,
    private navigation: NavigationService,
    private navbarService: NavBarStateService,
    private imageService: ImageService,
    private entities: DatabaseEntitiesService,
    private sidebarHostService: SideBarHostStateService,
    private addToPlaylistService: AddToPlaylistService,
    private exporter: ExportService,
    private cd: ChangeDetectorRef,
    private log: LogService,
    private listBaseService: ListBaseService
  ) {
    super();
  }

  ngOnInit(): void {
    this.expandPlayerOnPlay = this.options.getBoolean(ModuleOptionId.ExpandPlayerOnSongPlay);
    this.subs.sink = this.events.onEvent<IPlayerStatusChangedEventArgs>(AppEvent.PlayerStatusChanged)
    .subscribe(statusChangedArgs => {
      const item = this.spListBaseComponent.getItem(statusChangedArgs.track.songId) as ISongModel;
      if (item) {
        item.playerStatus = statusChangedArgs.track.playerStatus;
        this.cd.detectChanges();
      }
    });
    this.subs.sink = this.events.onEvent<ISongModel>(AppEvent.PlayerSongUpdated).subscribe(updatedSong => {
      this.updateSong(updatedSong);
    });
    this.subs.sink = this.events.onEvent<ISongModel>(AppEvent.ViewSongUpdated).subscribe(updatedSong => {
      this.updateSong(updatedSong);
    });
  }

  private updateSong(song: ISongModel): void {
    const item = this.spListBaseComponent.getItem(song.id) as ISongModel;
    if (item) {
      item.live = song.live;
      item.rating = song.rating;
      item.mood = song.mood;
      item.favorite = song.favorite;
      item.explicit = song.explicit;
      item.playCount = song.playCount;
      item.recentPlayIcon = song.recentPlayIcon;
      this.cd.detectChanges();
    }
  }

  private setBreadcrumbsForAlbumArtistSongs(song: ISongModel): void {
    const criteriaItem = new CriteriaItem('primaryArtistId', song.primaryArtistId);
    criteriaItem.displayName = this.db.displayName(criteriaItem.columnName);
    criteriaItem.columnValues[0].caption = song.primaryArtistName;
    // No need to react to breadcrumb events
    this.breadcrumbService.set([{
      icon: AppEntityIcons.AlbumArtist,
      criteriaItem: criteriaItem,
      origin: BreadcrumbSource.AlbumArtist
    }], { forceReload: true});
  }

  private async setBreadcrumbsForFeatArtistSongs(song: ISongModel): Promise<boolean> {
    const criteria = new Criteria('Search Results');
    criteria.searchCriteria.push(new CriteriaItem('id', song.id))
    // Get the list of feat. artists
    const songArtistRows = await this.db.getList(SongArtistViewEntity, criteria);
    const criteriaItem = new CriteriaItem('artistId');
    criteriaItem.comparison = CriteriaComparison.Equals;
    for (var songArtist of songArtistRows) {
      // Ignore the primary artist
      if (songArtist.artistId !== song.primaryArtistId) {
        criteriaItem.columnValues.push({
          value: songArtist.artistId,
          caption: songArtist.primaryArtistStylized
        });
      }
    }
    if (criteriaItem.columnValues.length) {
      this.breadcrumbService.set([{
        icon: AppEntityIcons.Artist,
        criteriaItem: criteriaItem,
        origin: BreadcrumbSource.Artist
      }], { forceReload: true });
      return true;
    }
    return false;
  }

  private setBreadcrumbsForAlbumSongs(song: ISongModel): void {
    // Primary Artist
    const artistCriteria = new CriteriaItem('primaryArtistId', song.primaryArtistId);
    artistCriteria.displayName = this.db.displayName(artistCriteria.columnName);
    artistCriteria.columnValues[0].caption = song.primaryArtistStylized;
    const artistBreadcrumb: IBreadcrumbModel = {
      icon: AppEntityIcons.AlbumArtist,
      criteriaItem: artistCriteria,
      origin: BreadcrumbSource.AlbumArtist
    };
    // Album
    const albumCriteria = new CriteriaItem('primaryAlbumId', song.primaryAlbumId);
    albumCriteria.displayName = this.db.displayName(albumCriteria.columnName);
    albumCriteria.columnValues[0].caption = song.primaryAlbumName;
    const albumBreadcrumb: IBreadcrumbModel = {
      icon: AppEntityIcons.Album,
      criteriaItem: albumCriteria,
      origin: BreadcrumbSource.Album
    };
    // Breadcrumbs
    this.breadcrumbService.set([ artistBreadcrumb, albumBreadcrumb ], { forceReload: true });
  }

  public onItemContentClick(song: ISongModel): void {
    this.playSong(song);
  }

  public onItemImageClick(song: ISongModel): void {
    this.menuService.hideSlideMenu();
    this.loadSongInPlayer(song, false, true);
  }

  private playSong(song: ISongModel): void {
    this.menuService.hideSlideMenu();
    this.loadSongInPlayer(song, true, this.expandPlayerOnPlay);
  }

  private isListInPlayer(playerList?: PlayerListModel): boolean {
    const list = playerList ? playerList : this.playerService.getState().playerList;
    return list.id === this.spListBaseComponent.model.criteriaResult.criteria.id;
  }

  private async loadSongInPlayer(song: ISongModel, play?: boolean, expand?: boolean): Promise<void> {
    const playerList = this.playerService.getState().playerList;
    let trackToLoad: IPlaylistSongModel;
    if (this.isListInPlayer(playerList)) {
      trackToLoad = playerList.getTrack(song);
    }

    if (!trackToLoad) {
      // Since we are about to play a new track:
      // 1. Stop the player
      // 2. Load this new track list
      // 3. Load this track
      const success = await this.playerService.stop();
      if (success) {
        const songList = this.spListBaseComponent.model.criteriaResult.items as ISongModel[];
        // For now, we are using this component only for search results,
        // but we should have an input property to specify the title of the play list
        playerList.loadSongs(
          this.spListBaseComponent.model.criteriaResult.criteria.id,
          this.spListBaseComponent.model.criteriaResult.criteria.name,
          songList);
        trackToLoad = playerList.getTrack(song);
      }
    }

    if (trackToLoad) {
      await this.playerService.setCurrentTrack(trackToLoad, play);
      if (expand) {
        this.playerOverlayService.expand();
      }
    }
    else {
      this.log.warn('Loading song in player. Track not found in the list of songs.', song.filePath);
    }
  }

  public onListInitialized(listBaseModel: IListBaseModel): void {
    // TODO: Add new menu: Save As Playlist, Save As Filter
    const navbarModel = this.navbarService.getState();

    navbarModel.menuList.push({
      caption: 'Decade',
      icon: AppAttributeIcons.Decade,
      action: () => {
        this.openDecadeFilterPanel();
      }
    });

    navbarModel.menuList.push({
      caption: 'Language',
      icon: AppAttributeIcons.Language,
      action: () => {
        this.openLanguageFilterPanel();
      }
    });

    navbarModel.menuList.push({
      caption: 'Mood',
      icon: AppAttributeIcons.MoodOn,
      action: () => {
        this.openMoodFilterPanel();
      }
    });

    navbarModel.menuList.push({ isSeparator: true });

    navbarModel.menuList.push({
      caption: 'Export...',
      icon: AppActionIcons.Export,
      action: () => {
        this.openFilterSelectionPanel();
      }
    });

    navbarModel.menuList.push({
      caption: 'Screenshot',
      icon: AppActionIcons.Screenshot,
      action: () => {
        this.imageService.getScreenshot().then(result => {
          const imagePreviewModel: IImagePreviewModel = {
            title: 'Screenshot',
            subTitle: 'Song List',
            src: result,
            componentType: ImagePreviewComponent
          };
          this.sidebarHostService.loadContent(imagePreviewModel);
        });
      },
      actionTimeout: 300
    });

    navbarModel.menuList.push({
      caption: 'Scroll To Song',
      icon: AppActionIcons.Scroll,
      action: () => {
        const playerList = this.playerService.getState().playerList;
        if (this.isListInPlayer(playerList)) {
          if (playerList.current) {
            const index = playerList.current.sequence - 1;
            this.spListBaseComponent.scrollTo(index);
          }
        }
      }
    });
  }

  private async getSongImage(song: ISongModel): Promise<IImage> {
    const relatedImage = await this.entities.getRelatedImage([song.id, song.primaryAlbumId]);
    if (relatedImage) {
      return this.imageService.getImageFromSource(relatedImage);
    }
    return {
      src: RelatedImageSrc.DefaultLarge,
      srcType: ImageSrcType.WebUrl
    };
  }

  private openQuickFilterPanel(): void {
    const chips = this.entities.getQuickFiltersForSongs(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getQuickFilterPanelModel(chips, 'Songs', AppEntityIcons.Song);
    model.onOk = okResult => {
      const criteria = new Criteria(model.title);
      // Keep sorting criteria
      criteria.sortingCriteria = this.spListBaseComponent.model.criteriaResult.criteria.sortingCriteria;
      // Add search criteria
      for (const valuePair of okResult.items) {
        if (valuePair.selected) {
          const criteriaItem = valuePair.value as CriteriaItem;
          criteria.quickCriteria.push(criteriaItem);
        }
      }
      this.spListBaseComponent.send(criteria);
    };
    this.sidebarHostService.loadContent(model);
  }

  private openSortingPanel(): void {
    const chips = this.entities.getSortingForSongs(this.spListBaseComponent.model.criteriaResult.criteria);
    const model = this.entities.getSortingPanelModel(chips, 'Songs', AppEntityIcons.Song);
    model.onOk = okResult => {
      const criteria = new Criteria(model.title);
      // Keep quick criteria
      criteria.quickCriteria = this.spListBaseComponent.model.criteriaResult.criteria.quickCriteria;
      // Add sorting criteria, we only support one item
      const chipItem = okResult.items.find(i => i.selected);
      if (chipItem) {
        const criteriaItems = chipItem.value as CriteriaItems;
        criteria.sortingCriteria = criteriaItems;
      }
      else {
        criteria.sortingCriteria = new CriteriaItems();
      }
      this.spListBaseComponent.send(criteria);
    };
    this.sidebarHostService.loadContent(model);
  }

  public onListUpdated(model: IListBaseModel): void {
    //this.manageRightIconsVisibility(model);
  }

  private manageRightIconsVisibility(model: IListBaseModel, navbar: INavbarModel): void {
    // Icons from right to left
    // BREADCRUMBS: sort, quick filter
    // TITLE, FILTER OFF, SEARCH OFF: sort, quick filter, search
    // TITLE, FILTER OFF, SEARCH ON: search off
    // TITLE, FILTER ON: filter remove
    switch (navbar.mode) {
      case NavbarDisplayMode.Title:
        // First hide all icons
        navbar.rightIcons.hideAll();
        // Determine if current criteria comes from a filter entity
        if (model.criteriaResult.criteria.filterId) {
          navbar.rightIcons.show('filterRemoveIcon');
          navbar.title = model.criteriaResult.criteria.name;
        }
        else {
          navbar.rightIcons.show('quickFilterIcon');
          navbar.rightIcons.show('searchIcon');
          navbar.rightIcons.show('sortIcon');
          navbar.title = appRoutes[AppRoute.Songs].name;
        }
        break;
      // Breadcrumbs
      case NavbarDisplayMode.Component:
        // First hide all icons
        navbar.rightIcons.hideAll();
        navbar.rightIcons.show('quickFilterIcon');
        navbar.rightIcons.show('sortIcon');
        break;
    }
    navbar.rightIcons.get('quickFilterIcon').off = !model.criteriaResult.criteria.quickCriteria.hasComparison();
  }

  private async openLanguageFilterPanel(): Promise<void> {
    const breadcrumbs = this.breadcrumbService.getState().items;
    const languageBreadcrumb = breadcrumbs.find(crumb => crumb.origin === BreadcrumbSource.Language);
    const languages = languageBreadcrumb?.criteriaItem?.columnValues?.length ? languageBreadcrumb.criteriaItem.columnValues.map(v => v.value) : [];
    const model = await this.entities.getValueListSelectorModel(ValueLists.Language.id, true, chip => {
      return languages.includes(chip.caption);
    });
    model.subTitle = 'Language';
    model.subTitleIcon = AppAttributeIcons.Language;
    model.onOk = result => {
      const selectedLanguages = result.items.filter(i => i.selected);
      const breadcrumbs = this.breadcrumbService.getState().items;
      const crumb = breadcrumbs.find(crumb => crumb.origin === BreadcrumbSource.Language);
      if (crumb) {
        // Edit the existing breadcrumb
        if (selectedLanguages.length) {
          crumb.criteriaItem.columnValues = [];
          selectedLanguages.forEach(l => crumb.criteriaItem.columnValues.push({ value: l.caption, caption: l.caption }));
          this.breadcrumbService.set(breadcrumbs);
        }
        // Remove the breadcrumb
        else {
          this.breadcrumbService.remove(crumb.sequence);
        }
      }
      else {
        // Create the breadcrumb and add the values
        if (selectedLanguages.length) {
          const criteriaItem = new CriteriaItem('language');
          criteriaItem.comparison = CriteriaComparison.Equals;
          selectedLanguages.forEach(l => criteriaItem.columnValues.push({ value: l.caption, caption: l.caption }));
          this.breadcrumbService.addOne({
            icon: AppAttributeIcons.Language,
            criteriaItem: criteriaItem,
            origin: BreadcrumbSource.Language
          });
        }
      }
    };
    this.sidebarHostService.loadContent(model);
  }

  private async openMoodFilterPanel(): Promise<void> {
    const breadcrumbs = this.breadcrumbService.getState().items;
    const moodBreadcrumb = breadcrumbs.find(crumb => crumb.origin === BreadcrumbSource.Mood);
    const moods = moodBreadcrumb?.criteriaItem?.columnValues?.length ? moodBreadcrumb.criteriaItem.columnValues.map(v => v.value) : [];
    const model = await this.entities.getValueListSelectorModel(ValueLists.Mood.id, false, chip => {
      return moods.includes(chip.caption);
    });
    model.subTitle = 'Mood';
    model.subTitleIcon = AppAttributeIcons.MoodOn;
    model.onOk = result => {
      const selectedMoods = result.items.filter(i => i.selected);
      const breadcrumbs = this.breadcrumbService.getState().items;
      const crumb = breadcrumbs.find(crumb => crumb.origin === BreadcrumbSource.Mood);
      if (crumb) {
        // Edit the existing breadcrumb
        if (selectedMoods.length) {
          crumb.criteriaItem.columnValues = [];
          selectedMoods.forEach(l => crumb.criteriaItem.columnValues.push({ value: l.caption, caption: l.caption }));
          this.breadcrumbService.set(breadcrumbs);
        }
        // Remove the breadcrumb
        else {
          this.breadcrumbService.remove(crumb.sequence);
        }
      }
      else {
        // Create the breadcrumb and add the values
        if (selectedMoods.length) {
          const criteriaItem = new CriteriaItem('mood');
          criteriaItem.comparison = CriteriaComparison.Equals;
          selectedMoods.forEach(l => criteriaItem.columnValues.push({ value: l.caption, caption: l.caption }));
          this.breadcrumbService.addOne({
            icon: AppAttributeIcons.MoodOn,
            criteriaItem: criteriaItem,
            origin: BreadcrumbSource.Mood
          });
        }
      }
    };
    this.sidebarHostService.loadContent(model);
  }

  private async openDecadeFilterPanel(): Promise<void> {
    const breadcrumbs = this.breadcrumbService.getState().items;
    const decadeBreadcrumb = breadcrumbs.find(crumb => crumb.origin === BreadcrumbSource.Decade);
    const decades = decadeBreadcrumb?.criteriaItem?.columnValues?.length ? decadeBreadcrumb.criteriaItem.columnValues.map(v => v.value) : [];
    const model = await this.entities.getSongValuesSelectorModel(DbColumn.ReleaseDecade, chip => {
      return decades.includes(chip.caption);
    });
    model.subTitle = 'Decade';
    model.subTitleIcon = AppAttributeIcons.Decade;
    model.onOk = result => {
      const selectedDecades = result.items.filter(i => i.selected);
      const breadcrumbs = this.breadcrumbService.getState().items;
      const crumb = breadcrumbs.find(crumb => crumb.origin === BreadcrumbSource.Decade);
      if (crumb) {
        // Edit the existing breadcrumb
        if (selectedDecades.length) {
          crumb.criteriaItem.columnValues = [];
          selectedDecades.forEach(l => crumb.criteriaItem.columnValues.push({ value: l.caption, caption: l.caption }));
          this.breadcrumbService.set(breadcrumbs);
        }
        // Remove the breadcrumb
        else {
          this.breadcrumbService.remove(crumb.sequence);
        }
      }
      else {
        // Create the breadcrumb and add the values
        if (selectedDecades.length) {
          const criteriaItem = new CriteriaItem('releaseDecade');
          criteriaItem.comparison = CriteriaComparison.Equals;
          selectedDecades.forEach(l => criteriaItem.columnValues.push({ value: l.caption, caption: l.caption }));
          this.breadcrumbService.addOne({
            icon: AppAttributeIcons.Decade,
            criteriaItem: criteriaItem,
            origin: BreadcrumbSource.Decade
          });
        }
      }
    };
    this.sidebarHostService.loadContent(model);
  }

  private async openFilterSelectionPanel(): Promise<void> {
    let exports  = await this.entities.getSyncProfiles(SyncType.ExportAll);
    exports = this.utility.sort(exports, 'name');
    const items: IChipItem[] = [];
    exports.forEach(exp => {
      items.push({
        caption: exp.name,
        value: exp.id,
        subText: exp.directoryArray?.length ? exp.directoryArray[0] : null
      });
    });
    const chipSelectionModel: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Export',
      titleIcon: AppActionIcons.Export,
      subTitle: 'Tracks: ' + this.spListBaseComponent.model.criteriaResult.items.length,
      subTitleIcon: AppEntityIcons.Song,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.SingleOk,
      items: items,
      onOk: model => {
        const selectedItems = model.items.filter(i => i.selected);
        if (selectedItems.length) {
          const profileId = selectedItems[0].value;
          this.exporter.run(profileId, { criteria: this.spListBaseComponent.model.criteriaResult.criteria });
        }
      }
    };
    this.sidebarHostService.loadContent(chipSelectionModel);
  }
}
