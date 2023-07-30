import { Component, OnInit } from '@angular/core';
import { ITrackListModel } from '../track-list/track-list.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ActivatedRoute } from '@angular/router';
import { DatabaseEntitiesService } from 'src/app/shared/services/database/database-entities.service';
import { PlaylistEntity, PlaylistSongEntity } from 'src/app/shared/entities';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { NavbarDisplayMode } from 'src/app/core/components/nav-bar/nav-bar-model.interface';
import { AppRoute, appRoutes } from 'src/app/app-routes';

@Component({
  selector: 'sp-playlist-song-list',
  templateUrl: './playlist-song-list.component.html',
  styleUrls: ['./playlist-song-list.component.scss']
})
export class PlaylistSongListComponent implements OnInit {
  public trackListModel: ITrackListModel;
  public tracks: PlaylistSongEntity[];
  constructor(
    private route: ActivatedRoute,
    private utility: UtilityService,
    private entities: DatabaseEntitiesService,
    private navbarService: NavBarStateService) { }

  ngOnInit(): void {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    const playlistId = this.utility.getRouteParam('id', this.route);
    await this.initializeNavbar(playlistId);
    await this.initializeTrackList(playlistId);
  }

  private async initializeTrackList(playlistId: string): Promise<void> {
    this.tracks = await this.entities.getTracks(playlistId);
  }

  private async initializeNavbar(playlistId: string): Promise<void> {
    const playlist = await PlaylistEntity.findOneBy({ id: playlistId});
    const routeInfo = appRoutes[AppRoute.Playlists];
    this.navbarService.set({
      mode: NavbarDisplayMode.Title,
      show: true,
      menuList: [
        {
          caption: 'Show All'
        }
      ],
      title: playlist.name,
      leftIcon: {
        icon: routeInfo.icon
      }
    });
  }

}
