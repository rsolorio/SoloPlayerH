import { IEventArgs } from "src/app/core/models/core.interface";
import { EventsService } from "src/app/core/services/events/events.service";
import { AppEvent } from "./events.enum";
import { PlayerSongStatus, PlayMode, RepeatMode } from "./player.enum";
import { IPlaylistSongModel } from "./playlist-song-model.interface";
import { ISongModel } from "./song-model.interface";

/**
 * Class responsible for handling the access to the tracks and updating the playlist status.
 */
export class PlayerListModel {
  constructor(private events: EventsService) {
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
    sequence: 0,
    id: '0',
    playlistId: '0',
    seconds: 0,
    name: '[No Selected]',
    albumName: '[Unknown]',
    artistName: '[Unknown]',
    filePath: null,
    imageSrc: null,
    canBeRendered: false,
    playerStatus: PlayerSongStatus.Empty
  };

  // Public Properties **************************************************************************
  public play: PlayMode;
  public repeat: RepeatMode;
  public current: IPlaylistSongModel = this.emptyTrack;
  public previous: IPlaylistSongModel;
  public next: IPlaylistSongModel;
  public isVisible: boolean;
  /** This is the list of items displayed to the user. */
  public items: IPlaylistSongModel[];

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

  public enqueueSong(track: IPlaylistSongModel, startIndex?: number) {
    this.enqueueSongs([track], startIndex);
  }

  public enqueueSongs(tracks: IPlaylistSongModel[], startIndex?: number) {
    if (!startIndex || startIndex < 0) {
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

  public getTrack(song: ISongModel): IPlaylistSongModel {
    return this.getTrackById(song.id);
  }

  public getTrackById(songId: string): IPlaylistSongModel {
    let result: IPlaylistSongModel = null;
    for (const track of this.items) {
      if (track.id === songId) {
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

  public loadList(songList: ISongModel[]): void {
    if (songList) {
      //this.Id = trackList.Id;
      //this.Name = trackList.Name;
      this.setPlaylistCursor(this.emptyTrack);
      //this.items = trackList.Children;
      this.forceReloadPlayModeItems();
    }
  }

  // Private Methods ****************************************************************************
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

    // Performs a Fisher-Yates shuffle
    // https://bost.ocks.org/mike/shuffle/
    let lastIndex = this.playModeItems.length;
    while (lastIndex) {
      // Get a random index with the max value of the last index
      const randomIndex = Math.floor(Math.random() * lastIndex--);
      //  Temporarily save the last "unpicked" item of the array
      const lastItem = this.playModeItems[lastIndex];
      // Place the random item at the end of the array
      this.playModeItems[lastIndex] = this.playModeItems[randomIndex];
      // Place the unpicked item in the spot where we picked the random item
      this.playModeItems[randomIndex] = lastItem;
    }
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

  private setPlaylistCursor(currentTrack: IPlaylistSongModel) {
    // This means we are removing the old track from being current
    if (this.hasTrack()) {
      this.current.playerStatus = PlayerSongStatus.Empty;
    }
    const args: IEventArgs<IPlaylistSongModel> = {
      oldValue: this.current,
      newValue: currentTrack
    };
    this.current = currentTrack;
    this.previous = this.innerGetPrevious(this.current);
    this.next = this.innerGetNext(this.current);
    // Now mark it as current
    if (this.current) {
      this.current.playerStatus = PlayerSongStatus.Stopped;
    }
    this.events.broadcast(AppEvent.PlaylistCurrentTrackChanged, args);
  }

  private setPlaylistCursorAuto() {
    if (!this.hasTrack() && this.playModeItems.length) {
      this.setPlaylistCursor(this.playModeItems[0]);
    }
    else {
      this.setPlaylistCursor(this.current);
    }
  }

  private forceReloadPlayModeItems() {
    this.playModeItemsRefreshRequired = true;
    this.reloadPlayModeItems();
  }
}