import { Component, OnInit } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { SearchWildcard } from 'src/app/shared/models/search.enum';
import { PlaylistListBroadcastService } from './playlist-list-broadcast.service';

@Component({
  selector: 'sp-playlist-list',
  templateUrl: './playlist-list.component.html',
  styleUrls: ['./playlist-list.component.scss']
})
export class PlaylistListComponent extends CoreComponent implements OnInit {

  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];

  constructor(
    private broadcastService: PlaylistListBroadcastService,
    private navbarService: NavBarStateService,
    private events: EventsService,
    private loadingService: LoadingViewStateService
  ){
    super();
  }

  ngOnInit(): void {
    this.initializeNavbar();
    this.initializeItemMenu();
  }

  private initializeNavbar(): void {
    const navbar = this.navbarService.getState();
    navbar.title = 'Playlists';
    navbar.onSearch = searchTerm => {
      this.loadingService.show();
      this.broadcastService.search(searchTerm).subscribe();
    };
    navbar.show = true;
    navbar.leftIcon = {
      icon: 'mdi-playlist-play mdi mdi'
    };
    navbar.componentType = null;
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Properties...',
      icon: 'mdi-square-edit-outline mdi',
      action: param => {
        const playlist = param as IPlaylistModel;
        if (playlist) {
        }
      }
    });
  }

  public onListInitialized(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loadAllPlaylists();
  }

  private loadAllPlaylists(): void {
    this.loadingService.show();
    this.broadcastService.search(SearchWildcard.All).subscribe();
  }

  public onItemContentClick(playlist: IPlaylistModel): void {
    this.onPlaylistClick(playlist);
  }

  private onPlaylistClick(playlist: IPlaylistModel): void {}

}
