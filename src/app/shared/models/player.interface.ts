import { IEventArgs } from "src/app/core/models/core.interface";
import { PlayerListModel } from "./player-list-model.class";
import { PlayerStatus } from "./player.enum";
import { IPlaylistSongModel } from "./playlist-song-model.interface";

/** Exposes the basic functionality that any audio player implementation should have. */
export interface IPlayer {
  play(): Promise<boolean>;
  playNext(): Promise<boolean>;
  playPrevious(): Promise<boolean>;
  togglePlay();
  stop(): Promise<boolean>;
  pause();
  playByTrack(track: IPlaylistSongModel): Promise<boolean>;
  playBySequence(sequence: number): Promise<boolean>;
  getState(): IPlayerState;
}

export interface IPlayerState {
  volume: number;
  playNextEnabled: boolean;
  /** The status of the player. */
  status: PlayerStatus;
  /** It is true when the play action has been fired and it is trying to load and play a track.
   * It is false when the play status changes, which means the loading process has finished.
  */
  isLoading: boolean;
  /** True if the html audio element fired a stalled event and hasn't been handled. */
  isStalled: boolean;
  hasError: boolean;
  elapsedSeconds: number;
  elapsedPercentage: number;
  loadedPercentage?: string;
  playerList: PlayerListModel;
  mediaSessionEnabled: boolean;
  playTimerInterval: number;
}

export interface IPlayerStatusChangedEventArgs extends IEventArgs<PlayerStatus> {
  track: IPlaylistSongModel;
}