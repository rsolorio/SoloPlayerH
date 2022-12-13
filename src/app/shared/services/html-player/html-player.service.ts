import { Injectable } from '@angular/core';
import { IStateService } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { AppEvent } from '../../models/events.enum';
import { PlayerListModel } from '../../models/player-list-model.class';
import { PlayerSongStatus, PlayerStatus } from '../../models/player.enum';
import { IPlayer, IPlayerState, IPlayerStatusChangedEventArgs } from '../../models/player.interface';
import { IPlaylistSongModel } from '../../models/playlist-song-model.interface';
import { HtmlMediaEvent, HtmlMediaSessionEvent } from './html-player.enum';
import { IMediaEventEntry } from './html-player.interface';

/**
 * Implementation of the IPlayer interface using the Html 5 Audio api.
 */
@Injectable({
  providedIn: 'root'
})
export class HtmlPlayerService implements IPlayer, IStateService<IPlayerState> {

  private state: IPlayerState = {
    volume: 0,
    playNextEnabled: true,
    status: PlayerStatus.Stopped,
    isLoading: false,
    isStalled: false,
    hasError: false,
    elapsedSeconds: 0,
    elapsedPercentage: '0%',
    loadedPercentage: 0,
    playerList: new PlayerListModel(this.events),
    mediaSessionEnabled: false,
    playTimerInterval: 1
  };
  private htmlAudio = new Audio();
  private eventHistory: IMediaEventEntry[] = [];
  private playTimer = null;
  private positionRefreshSuspended = false;
  private isStopping = false;
  private isManualPause = false;
  private stalledWaitTime = 2;
  /** Resolve callback of the stop promise. We save it to be called later. */
  private resolveStop: (value?: void) => void;

  constructor(
    private events: EventsService,
    private utilities: UtilityService,
    private log: LogService)
  {
    this.htmlAudio = new Audio();
    this.subscribeToAudioEvents();
  }

  // PUBLIC FUNCTIONS *****************************************************************************

  public getState(): IPlayerState {
    return this.state;
  }

  public stop(): Promise<any> {
    // Before we stop lets clear the events
    this.eventHistory = [];

    const stopPromise = new Promise<void>(resolve => {
      // Save the resolve function to be called later
      this.resolveStop = resolve;
    });

    // If the player is already stopped resolve the promise immediately
    if (this.state.status === PlayerStatus.Stopped) {
      // Changing the state resets the loading flag,
      // but in this scenario the state does not change,
      // so manually turn off the flag
      if (this.state.isLoading) {
        this.state.isLoading = false;
      }
      if (this.state.isStalled) {
        this.state.isStalled = false;
      }
      if (this.state.hasError) {
        this.state.hasError = false;
      }
      this.resolveStop();
    }
    else if (this.state.status === PlayerStatus.Paused) {
      this.htmlAudio.currentTime = 0;
      this.updateElapsedTime();
      this.onAudioStop();
      this.resolveStop();
    }
    // Do not resolve the promise, this will be resolved by the "pause" event
    else {
      this.isManualPause = true;
      this.isStopping = true;
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
      this.updateElapsedTime();
    }
    // Return the promise immediately, but it will be resolved later
    return stopPromise;
  }

  public pause() {
    if (this.isPlaying()) {
      this.isManualPause = true;
      this.htmlAudio.pause();
    }
  }

  /**
   * Plays the specified track.
   * This method assumes the track already belongs to the existing list of tracks in the player.
   * This method restarts the play action.
   * @param track The track to play.
   */
   public playByTrack(track: IPlaylistSongModel) {
    if (this.state.status === PlayerStatus.Playing) {
      this.stop().then(() => {
        this.setupNewTrack(track);
        this.playAudio();
      });
    }
    else if (this.state.status === PlayerStatus.Paused) {
      if (this.state.playerList.current.sequence === track.sequence) {
        this.playAudio();
      }
      else {
        this.stop().then(() => {
          this.setupNewTrack(track);
          this.playAudio();
        });
      }
    }
    else {
      this.setupNewTrack(track);
      this.playAudio();
    }
  }

  public playBySequence(sequence: number) {
    this.playByTrack(this.getTrack(sequence));
  }

  public play(): boolean {
    if (this.state.playerList.hasTrack()) {
      this.playByTrack(this.state.playerList.current);
      return true;
    }
    return false;
  }

  public playFirst(): boolean {
    const firstTrack = this.state.playerList.getFirstTrack();
    if (firstTrack) {
      this.playByTrack(firstTrack);
      return true;
    }
    return false;
  }

  public playNext() {
    if (this.state.playerList.next) {
      this.stop().then(() => {
        this.state.playerList.getNext();
        this.play();
      });
    }
  }

  /**
   * Plays the previous song in the list.
   * If the elapsed time exceeds the specified threshold the method will restart the track instead.
   * @param previousThreshold The maximum number of elapsed seconds to allow going back to the previous song.
   */
   public playPrevious(previousThreshold?: number) {
    if (previousThreshold && this.state.elapsedSeconds > previousThreshold) {
      // If elapsed time is beyond the threshold do not play previous, instead restart the song
      this.htmlAudio.currentTime = 0;
    }
    else {
      if (this.state.playerList.previous) {
        this.stop().then(() => {
          this.state.playerList.getPrevious();
          this.play();
        });
      }
    }
  }

  public togglePlay() {
    if (this.state.isLoading) {
      this.stop();
    }
    else {
      if (this.isPlaying()) {
        this.pause();
      }
      else {
        this.play();
      }
    }
  }

  /**
   * Sets the specified track as the current track in the playlist.
   * This method assumes the track already belongs to the existing playlist.
   * If the specified track is already playing this method does nothing.
   */
   public setCurrentTrack(track: IPlaylistSongModel, play?: boolean) {
    if (track === this.state.playerList.current) {
      // Play only if it is not playing
      if (play && this.state.status !== PlayerStatus.Playing) {
        this.playAudio();
      }
    }
    else {
      // New track so stop the player and load the new one
      this.stop().then(() => {
        this.setupNewTrack(track);
        if (play) {
          this.playAudio();
        }
      });
    }
  }

  // MEDIA SESSION ********************************************************************************

  // https://developer.mozilla.org/en-US/docs/Web/API/MediaSession
  // Media Session requires npm package for typescript to recognize the types: @types/wicg-mediasession

  private get nav(): any {
    return navigator;
  }

  /**
   * This is only supported for webkit browsers.
   * @returns True if the feature is supported.
   */
   private isMediaSessionSupported(): boolean {
    if ('mediaSession' in navigator) {
      return true;
    }
    return false;
  }

  private setMediaSessionMetadata() {
    if (!this.isMediaSessionSupported() || !this.state.mediaSessionEnabled) {
      return;
    }

    const track = this.state.playerList.current;

    if (this.nav.mediaSession.metadata &&
        this.nav.mediaSession.metadata.title === track.song.name &&
        this.nav.mediaSession.metadata.artist === track.song.artistName &&
        this.nav.mediaSession.metadata.album === track.song.albumName) {
          return;
    }

    // TODO: determine why TS doesn't recognize this
    // @ts-ignore
    this.nav.mediaSession.metadata = new MediaMetadata({
      title: track.song.name,
      artist: track.song.artistName,
      album: track.song.albumName,
      artwork: [{
        src: track.song.imageSrc,
        type: 'image/jpeg'
      }]
    });
  }

  private setMediaSessionListeners() {
    if (!this.isMediaSessionSupported() || !this.state.mediaSessionEnabled) {
      this.log.warn('MediaSession not supported.');
      return;
    }

    this.nav.mediaSession.setActionHandler(HtmlMediaSessionEvent.PreviousTrack, () => {
      this.playPrevious();
    });

    this.nav.mediaSession.setActionHandler(HtmlMediaSessionEvent.NextTrack, () => {
      this.playNext();
    });
  }

  // PRIVATE FUNCTIONS ****************************************************************************

  private isPlaying(): boolean {
    return this.state.status === PlayerStatus.Playing;
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
      if (!this.positionRefreshSuspended) {
        this.updateElapsedTime();
      }
    }, this.state.playTimerInterval * 1000);
  }

  private updateElapsedTime() {
    const oldPosition = this.state.elapsedSeconds;
    const currentTime = this.htmlAudio.currentTime;
    const seconds = Math.round(currentTime);
    if (isNaN(seconds)) {
      this.state.elapsedSeconds = 0;
      this.state.elapsedPercentage = '0';
    }
    else {
      this.state.elapsedSeconds = seconds;
      if (this.state.playerList.hasTrack() && this.state.playerList.current.song.seconds > 0) {
        const percentage = seconds / this.state.playerList.current.song.seconds * 100;
        this.state.elapsedPercentage = percentage.toFixed(2);
      }
      else {
        this.state.elapsedPercentage = '0';
      }
    }
    this.events.broadcast(AppEvent.PlayerPositionChanged, { oldValue: oldPosition, newValue: this.state.elapsedSeconds });
  }

  /**
   * Replaces the audio source with a new one and then loads it.
   * Make sure you call this method after the player is paused or stopped.
   * @param audioSrc The source of the audio to load.
   */
  private loadAudio(audioSrc: string) {
    this.htmlAudio.src = audioSrc;
    try {
      this.htmlAudio.load();
      this.registerEvent(HtmlMediaEvent.Custom, 'Load success');
    }
    catch (error) {
      this.log.error('Load audio error', error);
    }
  }

  private playAudio(startTime?: number) {
    this.htmlAudio.play().then(() => {
      this.registerEvent(HtmlMediaEvent.Custom, 'Play success');
    }).catch(error => {
      this.log.error('Play audio error', error);
    });
    if (startTime && startTime > 0) {
      this.htmlAudio.currentTime = startTime;
    }
  }

  private onAudioEnded() {
    this.onAudioStop();
    if (this.state.playNextEnabled) {
      this.playNext();
    }
  }

  private onAudioStop() {
    this.cancelPlayTimer();
    this.setStatus(PlayerStatus.Stopped);
    this.resetTitle();
  }

  private onAudioPause() {
    this.positionRefreshSuspended = true;
    this.setStatus(PlayerStatus.Paused);
    this.resetTitle();
  }

  private onAudioPlay() {
    this.positionRefreshSuspended = false;
    // If we come from a pause we should not restart timer
    if (this.state.status !== PlayerStatus.Paused) {
        this.restartPlayTimer();
    }
    this.setStatus(PlayerStatus.Playing);
    this.setCurrentSongAsTitle();
    this.setMediaSessionMetadata();
  }

  private getSongTitle(track?: IPlaylistSongModel) {
    if (!track) {
      track = this.state.playerList.current;
    }
    if (track) {
      return `${track.name} - ${track.song.artistName}`;
    }
    return null;
  }

  private setCurrentSongAsTitle() {
    const songTitle = this.getSongTitle();
    this.utilities.setDocTitle(songTitle);
  }

  private resetTitle() {
    this.utilities.setDocTitle();
  }

  private setupNewTrack(track: IPlaylistSongModel) {
    this.state.playerList.setCurrent(track);
    this.loadAudio(this.utilities.fileToUrl(track.song.filePath));
  }

  private getTrack(sequence: number): IPlaylistSongModel {
    if (this.state.playerList.items.length < sequence) {
      // Throw an error, this should not happen
    }
    // Sequence is basically a 1-based indexing so let's get the actual index
    const index = sequence - 1;
    return this.state.playerList.items[index];
  }

  private setStatus(status: PlayerStatus) {
    const oldStatus = this.state.status;
    this.state.status = status;
    // If started playing then we are not loading anymore
    // If stopped or paused we are not loading anymore
    this.state.isLoading = false;
    this.state.isStalled = false;
    this.state.hasError = false;
    switch (this.state.status) {
      case PlayerStatus.Playing:
        this.state.playerList.current.song.playerStatus = PlayerSongStatus.Playing;
        break;
      case PlayerStatus.Paused:
        this.state.playerList.current.song.playerStatus = PlayerSongStatus.Paused;
        break;
      case PlayerStatus.Stopped:
        this.state.playerList.current.song.playerStatus = PlayerSongStatus.Stopped;
        break;
    }
    const eventArgs: IPlayerStatusChangedEventArgs = {
      oldValue: oldStatus,
      newValue: this.state.status,
      track: this.state.playerList.current
    };
    this.events.broadcast(AppEvent.PlayerStatusChanged, eventArgs);

    // TODO: fire PlayerSongStatusChanged event as well
  }

  private subscribeToAudioEvents() {
    this.htmlAudio.addEventListener(HtmlMediaEvent.TimeUpdate, () => {
      if (this.htmlAudio.currentTime) {
        this.log.debug('timeupdate ' + this.htmlAudio.currentTime);
      }
      else {
        this.registerEvent(HtmlMediaEvent.TimeUpdate, '01 - time has been set to 0');
      }
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Play, () => {
      this.registerEvent(HtmlMediaEvent.Play, '02 - play action has been called');
      this.state.isLoading = true;
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.LoadStart, () => {
      this.registerEvent(HtmlMediaEvent.LoadStart, '03 - starting calling the endpoint');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.DurationChange, () => {
      this.registerEvent(HtmlMediaEvent.DurationChange, '04 - audio duration has been set');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.LoadedData, () => {
      this.registerEvent(HtmlMediaEvent.LoadedData, '05 - endpoint returned audio data');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.CanPlay, () => {
      this.registerEvent(HtmlMediaEvent.CanPlay, '06 - ready to play');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Playing, () => {
      this.registerEvent(HtmlMediaEvent.Playing, '07');
      this.onAudioPlay();
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.CanPlayThrough, () => {
      this.registerEvent(HtmlMediaEvent.CanPlayThrough, '08 - no issues on continuos playing');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Progress, () => {
      this.registerEvent(HtmlMediaEvent.Progress, 'xx - downloading chunk');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Suspend, () => {
      this.registerEvent(HtmlMediaEvent.Suspend, 'xx - chunk downloaded');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Pause, () => {
      // An automatic pause event happens just before the ended event
      // or if the user pauses outside the app, for instance, when pausing using
      // the audio controls in the lock screen of the device
      if (this.isManualPause) {
        this.registerEvent(HtmlMediaEvent.Pause, 'xx - manual');
          this.isManualPause = false;
          if (this.isStopping) {
              this.isStopping = false;
              this.onAudioStop();
              if (this.resolveStop) {
                this.resolveStop();
              }
          }
          else {
              this.onAudioPause();
          }
      }
      else {
          const currentTime = this.htmlAudio.currentTime;
          if (currentTime < this.state.playerList.current.song.seconds) {
              // If this happens let's assume the song was paused by an external action
              this.onAudioPause();
              this.registerEvent(HtmlMediaEvent.Pause, 'xx - external');
          }
          else {
            // Otherwise, this is an auto pause that will lead to a ended event, in this case do nothing here
            this.registerEvent(HtmlMediaEvent.Pause, 'xx - about to end');
          }
      }
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Ended, () => {
      this.registerEvent(HtmlMediaEvent.Ended);
      this.onAudioEnded();
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Stops, () => {
      this.registerEvent(HtmlMediaEvent.Stops);
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Stalled, () => {
      this.state.isStalled = true;
      this.registerEvent(HtmlMediaEvent.Stalled);
      this.attemptPlayRestart(this.stalledWaitTime);
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Emptied, () => {
      this.registerEvent(HtmlMediaEvent.Emptied);
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Error, (errorInfo) => {
      this.registerEvent(HtmlMediaEvent.Error);
      this.log.error('Error event raised.', errorInfo);
      this.state.hasError = true;
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Abort, () => {
      this.registerEvent(HtmlMediaEvent.Abort, 'xx - no need to load more audio for now');
    });

    this.setMediaSessionListeners();
  }

  private registerEvent(event: HtmlMediaEvent, message?: string) {
    this.eventHistory.push({
      event: event,
      timestamp: new Date().toLocaleString(),
      networkState: this.htmlAudio.networkState,
      error: this.htmlAudio.error,
      message: message
    });
  }

  /**
   * If the player is loading or stalled, it will create a timeout for an x number of seconds
   * that will stop and then start the player.
   */
   private attemptPlayRestart(waitTime: number) {
    if (this.state.isLoading || this.state.isStalled) {
      // Restart after a period of time if the player is still loading
      setTimeout(() => {
        if (this.state.isLoading || this.state.isStalled) {
          this.registerEvent(HtmlMediaEvent.Custom, 'Too much time loading or stalled, attempting restart');
          this.stop().then(() => {
            this.play();
          });
        }
      }, waitTime * 1000);
    }
  }
}
