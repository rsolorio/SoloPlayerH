import { IEventArgs } from "src/app/core/models/core.interface";
import { EventsService } from "src/app/core/services/events/events.service";
import { UtilityService } from "src/app/core/services/utility/utility.service";
import { RelatedImageSrc } from "../services/database/database.seed";
import { IDbModel } from "./base-model.interface";
import { PlayerSongStatus, PlayMode, RepeatMode } from "./player.enum";
import { IPlaylistSongModel } from "./playlist-song-model.interface";
import { ISongModel } from "./song-model.interface";
import { ImageSrcType } from "src/app/core/models/core.enum";
import { fisherYatesShuffle } from "src/app/app-exports";
import { AppEvent } from "src/app/app-events";

/**
 * Class responsible for handling the access to the tracks and updating the playlist status.
 */
export class PlayerListModel implements IDbModel {
  constructor(private events: EventsService, private utilities: UtilityService) {
    this.play = PlayMode.Sequence;
    this.repeat = RepeatMode.All;
    this.items = [];
    this.playModeItems = [];
    this.isVisible = false;
  }
  // Private Properties *************************************************************************
  /** This is the list of items and how are they actually sorted and used for the different play modes. */
  private playModeItems: IPlaylistSongModel[];
  private playModeItemsRefreshRequired = false;
  private emptyTrack: IPlaylistSongModel = {
    playlistId: null,
    songId: null,
    sequence: 0,
    id: '0',
    name: '[Empty Song]',
    cleanName: '[Empty Song]',
    primaryAlbumId: null,
    filePath: null,
    fileExtension: null,
    fileSize: 0,
    trackNumber: 0,
    mediaNumber: 0,
    releaseYear: 0,
    releaseDecade: 0,
    rating: 0,
    playCount: 0,
    performerCount: 0,
    genre: null,
    mood: null,
    language: null,
    lyrics: null,
    seconds: 0,
    duration: '00:00',
    bitrate: 0,
    frequency: 0,
    vbr: false,
    favorite: false,
    live: false,
    explicit: false,
    addDate: null,
    changeDate: null,
    playDate: null,
    primaryAlbumName: '[Empty Album]',
    primaryArtistId: null,
    primaryArtistName: '[Empty Artist]',
    primaryArtistStylized: '[Empty Artist]',
    playerStatus: PlayerSongStatus.Empty,
    
    image: {
      defaultSrc: RelatedImageSrc.DefaultSmall,
      src: RelatedImageSrc.DefaultSmall,
      srcType: ImageSrcType.WebUrl
    },
    canBeRendered: false,
    selected: false,
  };

  // IDbModel
  public id: string;
  public name: string;

  // Public Properties **************************************************************************
  public play: PlayMode;
  public repeat: RepeatMode;
  public current: IPlaylistSongModel = this.emptyTrack;
  public previous: IPlaylistSongModel;
  public next: IPlaylistSongModel;
  public isVisible: boolean;
  /** This is the list of items displayed to the user. */
  public items: IPlaylistSongModel[];
  public doAfterSongStatusChange: (song: ISongModel, oldStatus: PlayerSongStatus) => void;

  // Public Methods *****************************************************************************
  /** Returns whether the playlist has a track set as current */
  public hasTrack(): boolean {
    return this.current && this.current !== this.emptyTrack;
  }

  public hasTracks(): boolean {
    return this.items.length > 0;
  }

  public getFirstTrack(): IPlaylistSongModel {
    if (this.items.length > 0) {
      return this.items[0];
    }
    return null;
  }

  public getNext() {
    const next = this.innerGetNext(this.current);
    this.setPlaylistCursor(next);
  }

  public getPrevious() {
    const previous = this.innerGetPrevious(this.current);
    this.setPlaylistCursor(previous);
  }

  /**
   * Adds one track to the list.
   */
  public enqueueOne(track: IPlaylistSongModel, startIndex: number = 0) {
    this.enqueue([track], startIndex);
  }

  /**
   * Adds multiple tracks to the list.
   */
  public enqueue(tracks: IPlaylistSongModel[], startIndex: number = 0) {
    if (startIndex < 0) {
      throw new Error('Index cannot be less than 0.');
    }

    if (!tracks) {
      return;
    }

    let insertIndex = startIndex;
    const originalCount = this.items.length;
    for (const track of tracks) {
      // Previously, we avoided to insert enqueued songs
      // Now, we always insert songs as new tracks
      if (insertIndex >= this.items.length) {
        this.items.push(track);
      }
      else {
        this.items.splice(insertIndex, 0, track);
      }
      // Insert the following item below this one
      insertIndex++;
    }

    if (originalCount < this.items.length) {
        this.refreshTrackSequence(this.items, startIndex);
        this.forceReloadPlayModeItems();
        // This will refresh available tracks after reordering the track list
        this.setPlaylistCursorAuto();
    }
  }

  /**
   * Loads a playlist and clears the current track.
   */
  public load(playlistId: string, playlistName: string, tracks: IPlaylistSongModel[]): void {
    this.id = playlistId;
    this.name = playlistName;
    this.items = tracks;
    // This will the current track
    this.setPlaylistCursor(this.emptyTrack);
    this.forceReloadPlayModeItems();
  }

  /**
   * Loads a playlist from a song list and clears the current track.
   */
  public loadSongs(playlistId: string, playlistName: string, songs: ISongModel[]): void {
    const tracks: IPlaylistSongModel[] = [];
    let sequence = 0;
    for (const song of songs) {
      sequence++;
      tracks.push(this.toTrack(song, playlistId, sequence));
    }
    this.load(playlistId, playlistName, tracks);
  }

  /**
     * Sets the specified track as current in the playlist.
     * @param track The track to set as current.
     * @returns True if the track changed or False otherwise
     */
   public setCurrent(track: IPlaylistSongModel): boolean {
    if (this.hasTrack() && this.current === track) {
      return false;
    }

    // TODO: validation to set only a track that already exists on the playlist

    this.setPlaylistCursor(track);
    return true;
  }

  public contains(song: ISongModel): boolean {
    return this.getTrack(song) !== null;
  }

  /**
   * Tries to find the song (by id) in the current list of tracks.
   * @param song The song to find.
   * @returns A track model.
   */
  public getTrack(song: ISongModel): IPlaylistSongModel {
    return this.getTrackById(song.id);
  }

  public getTrackById(songId: string): IPlaylistSongModel {
    let result: IPlaylistSongModel = null;
    for (const track of this.items) {
      if (track.songId === songId) {
        result = track;
      }
    }
    return result;
  }

  public clear() {
    // Remove available songs
    this.setPlaylistCursor(this.emptyTrack);
    // Clear public list
    this.items = [];
    // Clear internal list
    this.playModeItems = [];
  }

  // Private Methods ****************************************************************************
  private toTrack(song: ISongModel, playlistId: string, sequence: number): IPlaylistSongModel {
    return {
      ...song,
      playlistId: playlistId,
      songId: song.id,
      sequence: sequence,
      canBeRendered: false,
      selected: false
    };
  }

  /**
   * Reorders the list of items based on the play mode.
   */
  private reloadPlayModeItems() {
    if (!this.playModeItemsRefreshRequired) {
        return;
    }
    this.playModeItemsRefreshRequired = false;

    switch (this.play) {
      case PlayMode.Sequence:
        this.reloadPlayModeItemsSequence();
        break;
      case PlayMode.Random:
        this.reloadPlayModeItemsRandom();
        break;
      case PlayMode.Smart:
        this.reloadPlayModeItemsSmart();
        break;
      default:
        throw new Error('PlayMode not implemented');
    }
  }

  private reloadPlayModeItemsSequence() {
    this.playModeItems = this.items.slice();
  }

  private reloadPlayModeItemsRandom() {
    this.playModeItems = this.items.slice();
    fisherYatesShuffle(this.playModeItems);
  }

  private reloadPlayModeItemsSmart() {
    // TODO: determine the smart mechanism
    this.playModeItems = this.items.slice();
  }

  private innerGetNext(currentTrack: IPlaylistSongModel): IPlaylistSongModel {
    if (!currentTrack) {
      return null;
    }

    if (this.repeat === RepeatMode.One) {
      return currentTrack;
    }

    this.reloadPlayModeItems();

    let result: IPlaylistSongModel = null;

    // Get next index
    // This line relies on the current track being the original instance of the track
    // It could be the same track, but a new instance, if that happens this will not work
    // If nextIndex is 0 it means the currentTrack was not found.
    // TODO: get index by another method?
    const nextIndex = this.playModeItems.indexOf(currentTrack) + 1;
    // Get next item
    if (nextIndex >= this.playModeItems.length) {
      // If we are at the bottom, start over at the top when RepeatAll
      if (this.repeat === RepeatMode.All) {
        result = this.playModeItems[0];
      }
    }
    else {
      result = this.playModeItems[nextIndex];
    }
    return result;
  }

  private innerGetPrevious(currentTrack: IPlaylistSongModel): IPlaylistSongModel {
    if (!currentTrack) {
      return null;
    }

    if (this.repeat === RepeatMode.One) {
      return currentTrack;
    }

    this.reloadPlayModeItems();

    let result: IPlaylistSongModel = null;
    // Get previous index
    const previousIndex = this.playModeItems.indexOf(currentTrack) - 1;
    // Get previous item
    if (previousIndex < 0) {
      // If we are at the top of the list go back to the bottom when RepeatAll
      if (this.repeat === RepeatMode.All) {
        result = this.playModeItems[this.playModeItems.length - 1];
      }
    }
    else {
      result = this.playModeItems[previousIndex];
    }

    return result;
  }

  private refreshTrackSequence(trackList: IPlaylistSongModel[], startIndex: number, stopIndex?: number) {
    if (!stopIndex) {
      stopIndex = trackList.length - 1;
    }
    for (let index = startIndex; index <= stopIndex; index++) {
      trackList[index].sequence = index + 1;
    }
  }

  private isSameTrack(a: IPlaylistSongModel, b: IPlaylistSongModel): boolean {
    // In theory there should not be two different tracks with the same sequence
    return a.playlistId === b.playlistId && a.sequence === b.sequence;
  }

  private setPlaylistCursor(currentTrack: IPlaylistSongModel) {
    // Don't do anything if it is the same track
    if (this.isSameTrack(currentTrack, this.current)) {
      return;
    }
    // This means we are removing the old track from being current
    if (this.hasTrack() && this.current.playerStatus !== PlayerSongStatus.Empty) {
      const oldStatus = this.current.playerStatus;
      this.current.playerStatus = PlayerSongStatus.Empty;
      if (this.doAfterSongStatusChange) {
        this.doAfterSongStatusChange(this.current, oldStatus);
      }
    }
    const args: IEventArgs<IPlaylistSongModel> = {
      oldValue: this.current,
      newValue: currentTrack
    };
    this.current = currentTrack;
    this.previous = this.innerGetPrevious(this.current);
    this.next = this.innerGetNext(this.current);
    // Now mark it as current
    if (this.hasTrack() && this.current.playerStatus !== PlayerSongStatus.Stopped) {
      const oldStatus = this.current.playerStatus;
      this.current.playerStatus = PlayerSongStatus.Stopped;
      if (this.doAfterSongStatusChange) {
        this.doAfterSongStatusChange(this.current, oldStatus);
      }
    }

    this.events.broadcast(AppEvent.PlaylistCurrentTrackChanged, args);
  }

  /**
   * If no current track, it will load the first track in the list;
   * otherwise it will load the current track into the player.
   */
  private setPlaylistCursorAuto() {
    if (!this.hasTrack() && this.playModeItems.length) {
      this.setPlaylistCursor(this.playModeItems[0]);
    }
    else {
      this.setPlaylistCursor(this.current);
    }
  }

  /**
   * Forces to reorder the items based on the play mode.
   */
  private forceReloadPlayModeItems() {
    this.playModeItemsRefreshRequired = true;
    this.reloadPlayModeItems();
  }
}