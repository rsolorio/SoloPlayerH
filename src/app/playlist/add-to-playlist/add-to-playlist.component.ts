import { Component, OnInit } from '@angular/core';
import { PlaylistEntity, PlaylistSongEntity, PlaylistViewEntity } from 'src/app/shared/entities';
import { IPlaylistModel } from 'src/app/shared/models/playlist-model.interface';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { CriteriaComparison, CriteriaSortDirection } from 'src/app/shared/services/criteria/criteria.enum';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { IAddToPlaylistModel } from './add-to-playlist.interface';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ValueLists } from 'src/app/shared/services/database/database.lists';
import { DatabaseLookupService } from 'src/app/shared/services/database/database-lookup.service';
import { ISongModel } from 'src/app/shared/models/song-model.interface';
import { SideBarStateService } from 'src/app/core/components/side-bar/side-bar-state.service';

@Component({
  selector: 'sp-add-to-playlist',
  templateUrl: './add-to-playlist.component.html',
  styleUrls: ['./add-to-playlist.component.scss']
})
export class AddToPlaylistComponent implements OnInit {
  /** Display all playlists and hide recent playlists. */
  public displayAll = false;
  /** Sort recent playlists by change date ascending. */
  public sortRecentsAscending = false;
  /** Sort all playlists by name descending. */
  public sortAllDescending = false;
  /** Model that will be set by the calling service when the component is initialized. */
  public model: IAddToPlaylistModel;
  /** List of playlists to display. */
  public playlists: IPlaylistModel[];
  public newPlaylistName: string;
  public searchPlaylistName: string;
  constructor(
    private db: DatabaseService,
    private utility: UtilityService,
    private lookup: DatabaseLookupService,
    private sidebarService: SideBarStateService) { }

  ngOnInit(): void {
    this.loadData();
  }

  public loadData(): void {
    if (this.displayAll) {
      this.loadAllPlaylists();
    }
    else {
      this.loadRecentPlaylists();
    }
  }

  public onRecentsClick(): void {
    this.displayAll = false;
    this.loadData();
  }

  public onAllClick(): void {
    this.displayAll = true;
    this.loadData();
  }

  public onAddPlaylist(): void {
    if (this.newPlaylistName) {
      this.addPlaylist(this.newPlaylistName).then(() => {
        // Clear the text box
        this.newPlaylistName = '';
      });
    }
  }

  public onSearchPlaylist(): void {
    this.loadAllPlaylists();
  }

  public onPlaylistClick(playlist: IPlaylistModel): void {
    this.addSongsToPlaylist(this.model.songs, playlist.id).then(() => {
      // TODO: if the song or songs are not added do not close the panel
      this.sidebarService.hideRight();
    })
  }

  public onSortRecentClick(): void {
    this.sortRecentsAscending = !this.sortRecentsAscending;
    this.loadData();
  }

  public onSortAllClick(): void {
    this.sortAllDescending = !this.sortAllDescending;
    this.loadData();
  }

  private async loadRecentPlaylists(): Promise<void> {
    const criteria = new Criteria();
    criteria.paging.pageSize = 10;
    criteria.addSorting('changeDate', this.sortRecentsAscending ? CriteriaSortDirection.Ascending : CriteriaSortDirection.Descending);
    this.playlists = await this.db.getList(PlaylistViewEntity, criteria);
  }

  private async loadAllPlaylists(): Promise<void> {
    const criteria = new Criteria();
    if (this.searchPlaylistName) {
      const criteriaItem = new CriteriaItem('name', '%' + this.searchPlaylistName + '%');
      criteriaItem.comparison = CriteriaComparison.Like;
      criteria.searchCriteria.push(criteriaItem);
    }
    criteria.addSorting('name', this.sortAllDescending ? CriteriaSortDirection.Descending : CriteriaSortDirection.Ascending);
    this.playlists = await this.db.getList(PlaylistViewEntity, criteria);
  }

  private async addPlaylist(name: string): Promise<void> {
    const existingPlaylist = await PlaylistEntity.findOneBy({ name: name});
    if (existingPlaylist) {
      // Some message the list already exists
    }
    else {
      const newPlaylist = new PlaylistEntity();
      newPlaylist.id = this.utility.newGuid();
      newPlaylist.name = name;
      newPlaylist.hash = this.lookup.hashPlaylist(name);
      newPlaylist.favorite = false;
      newPlaylist.imported = false;
      newPlaylist.groupId = ValueLists.PlaylistGroup.entries.Default;
      newPlaylist.changeDate = new Date();
      await newPlaylist.save();

      // Reload the playlists
      this.loadRecentPlaylists();
    }
  }

  private async addSongsToPlaylist(songs: ISongModel[], playlistId: string): Promise<void> {
    let trackAdded = false;
    let sequence = await PlaylistEntity.countBy({ id: playlistId});
    for (const song of songs) {
      const existingPlaylistSong = await PlaylistSongEntity.findOneBy({ playlistId: playlistId, songId: song.id });
      if (existingPlaylistSong) {
        // Send some notification?
        // Depends on option to add or reject the song?
      }
      else {
        sequence++;
        const playlistSong = new PlaylistSongEntity();
        playlistSong.playlistId = playlistId;
        playlistSong.songId = song.id;
        playlistSong.sequence = sequence;
        await playlistSong.save()
        trackAdded = true;
      }
    }

    if (trackAdded) {
      const playlist = await PlaylistEntity.findOneBy({ id: playlistId });
      playlist.changeDate = new Date();
      await playlist.save();
    }
  }
}
