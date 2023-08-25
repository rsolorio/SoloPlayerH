import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { MenuService } from 'src/app/core/services/menu/menu.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerOverlayStateService } from 'src/app/player/player-overlay/player-overlay-state.service';
import { IListBaseModel } from 'src/app/shared/components/list-base/list-base-model.interface';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { AppEvent } from 'src/app/shared/models/events.enum';
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
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { DbColumn } from 'src/app/shared/services/database/database.columns';

@Component({
  selector: 'sp-song-list',
  templateUrl: './song-list.component.html',
  styleUrls: ['./song-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SongListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public PlayerSongStatus = PlayerSongStatus;
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
        icon: 'mdi-square-edit-outline mdi',
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
        icon: 'mdi-web mdi',
        action: (menuItem, param) => {
          const song = param as ISongModel;
          this.utility.googleSearch(`${song.primaryArtistName} ${song.name}`);
        }
      },
      {
        caption: 'Album Artist Songs',
        icon: 'mdi-account-badge mdi',
        action: (menuItem, param) => {
          const song = param as ISongModel;
          this.setBreadcrumbsForAlbumArtistSongs(song);
        }
      },
      {
        caption: 'Feat. Artists Songs',
        icon: 'mdi-account-music mdi',
        action: (menuItem, param) => {
          const song = param as ISongModel;
          this.setBreadcrumbsForFeatArtistSongs(song);
        }
      },
      {
        caption: 'Album Songs',
        icon: 'mdi-album mdi',
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
        icon: 'mdi-filter-variant-remove mdi',
        action: iconAction => {
          // Since this icon is displayed in Title mode, all icons should be displayed in this mode
          this.navbarService.getState().rightIcons.forEach(i => i.hidden = false);
          // Except for this one
          iconAction.hidden = true;
          this.spListBaseComponent.send(new Criteria());
        },
        hidden: true
      }
    ],
    searchIconEnabled: true,
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
    },
    afterNavbarModeChange: model => {
      this.manageRightIconsVisibility(model);
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
    private cd: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.expandPlayerOnPlay = this.options.getBoolean(ModuleOptionId.ExpandPlayerOnSongPlay);
    this.subs.sink = this.events.onEvent<IPlayerStatusChangedEventArgs>(AppEvent.PlayerStatusChanged)
    .subscribe(() => {
      this.cd.detectChanges();
    });
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

  private loadSongInPlayer(song: ISongModel, play?: boolean, expand?: boolean): void {
    const playerList = this.playerService.getState().playerList;
    if (this.isListInPlayer(playerList)) {
      const track = playerList.getTrack(song);
      this.playerService.setCurrentTrack(track, play).then(() => {
        if (expand) {
          this.playerOverlayService.expand();
        }
      });
    }
    else {
      // Since we are about to play a new track:
      // 1. Stop the player
      // 2. Load this new track list
      // 3. Load this track
      this.playerService.stop().then(success => {
        if (success) {
          const songList = this.spListBaseComponent.model.criteriaResult.items as ISongModel[];
          // For now, we are using this component only for search results,
          // but we should have an input property to specify the title of the play list
          playerList.loadSongs(
            this.spListBaseComponent.model.criteriaResult.criteria.id,
            this.spListBaseComponent.model.criteriaResult.criteria.name,
            songList);
          const track = playerList.getTrack(song);
          this.playerService.setCurrentTrack(track, play).then(() => {
            if (expand) {
              this.playerOverlayService.expand();
            }
          });
        }
      });
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
      icon: AppAttributeIcons.Mood,
      action: () => {
        this.openMoodFilterPanel();
      }
    });

    navbarModel.menuList.push({ isSeparator: true });

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
    this.manageRightIconsVisibility(model);
  }

  private manageRightIconsVisibility(model: IListBaseModel): void {
    // Icons from right to left
    // BREADCRUMBS: sort, quick filter
    // TITLE, FILTER OFF, SEARCH OFF: sort, quick filter, search
    // TITLE, FILTER OFF, SEARCH ON: search off
    // TITLE, FILTER ON: filter remove
    const navbarState = this.navbarService.getState();

    switch (navbarState.mode) {
      case NavbarDisplayMode.Title:
        // First hide all icons
        model.rightIcons.forEach(i => i.hidden = true);
        // Determine if current criteria comes from a filter entity
        if (model.criteriaResult.criteria.filterId) {
          navbarState.rightIcons.find(i => i.id === 'filterRemoveIcon').hidden = false;
          navbarState.title = model.criteriaResult.criteria.name;
        }
        else {
          navbarState.rightIcons.find(i => i.id === 'quickFilterIcon').hidden = false
          navbarState.rightIcons.find(i => i.id === 'searchIcon').hidden = false;
          navbarState.rightIcons.find(i => i.id === 'sortIcon').hidden = false;
          navbarState.title = appRoutes[AppRoute.Songs].name;
        }
        break;
      // Breadcrumbs
      case NavbarDisplayMode.Component:
        // First hide all icons
        model.rightIcons.forEach(i => i.hidden = true);
        navbarState.rightIcons.find(i => i.id === 'quickFilterIcon').hidden = false;
        navbarState.rightIcons.find(i => i.id === 'sortIcon').hidden = false;
        break;
    }
    const iconOff = !model.criteriaResult.criteria.quickCriteria.hasComparison();
    navbarState.rightIcons.find(i => i.id === 'quickFilterIcon').off = iconOff;
  }

  public async openLanguageFilterPanel(): Promise<void> {
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

  public async openMoodFilterPanel(): Promise<void> {
    const breadcrumbs = this.breadcrumbService.getState().items;
    const moodBreadcrumb = breadcrumbs.find(crumb => crumb.origin === BreadcrumbSource.Mood);
    const moods = moodBreadcrumb?.criteriaItem?.columnValues?.length ? moodBreadcrumb.criteriaItem.columnValues.map(v => v.value) : [];
    const model = await this.entities.getValueListSelectorModel(ValueLists.Mood.id, false, chip => {
      return moods.includes(chip.caption);
    });
    model.subTitle = 'Mood';
    model.subTitleIcon = AppAttributeIcons.Mood;
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
            icon: AppAttributeIcons.Mood,
            criteriaItem: criteriaItem,
            origin: BreadcrumbSource.Mood
          });
        }
      }
    };
    this.sidebarHostService.loadContent(model);
  }

  public async openDecadeFilterPanel(): Promise<void> {
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
}
