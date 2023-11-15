import { Injectable } from '@angular/core';
import { IStateService } from 'src/app/core/models/core.interface';
import { EventsService } from 'src/app/core/services/events/events.service';
import { LogService } from 'src/app/core/services/log/log.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { PlayerListModel } from '../../models/player-list-model.class';
import { PlayerSongStatus, PlayerStatus } from '../../models/player.enum';
import { IPlayer, IPlayerState, IPlayerStatusChangedEventArgs, IPlayerTrackCount } from '../../models/player.interface';
import { IPlaylistSongModel } from '../../models/playlist-song-model.interface';
import { HtmlMediaEvent, HtmlMediaSessionEvent } from './html-player.enum';
import { IMediaEventEntry } from './html-player.interface';
import { AppEvent } from 'src/app/app-events';

/**
 * Implementation of the IPlayer interface using the Html 5 Audio api.
 * playByTrack implementation:
 * - playBySequence > playByTrack
 * - play > playByTrack
 * - playFirst > playByTrack
 * setupNewTrack implementation:
 * - playByTrack > setupNewTrack
 * - setupCurrentTrack > setupNewTrack
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
    elapsedPercentage: 0,
    previousElapsedSeconds: 0,
    previousElapsedPercentage: 0,
    playerList: new PlayerListModel(this.events, this.utilities),
    mediaSessionEnabled: false,
    playTimerInterval: 1,
    playPercentage: 0
  };
  private htmlAudio = new Audio();
  private eventHistory: IMediaEventEntry[] = [];
  private playTimer = null;
  private isStopping = false;
  private isManualPause = false;
  private stalledWaitTime = 2;
  /** Flag that determines if the current track has been played. */
  private played = false;
  /** Resolve callback of the stop promise. We save it to be called later. */
  private resolveStop: (value: boolean) => void;

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

  public stop(): Promise<boolean> {
    const stopPromise = new Promise<boolean>(resolve => {
      // Save the resolve function to be called later
      this.resolveStop = resolve;
    });

    if (this.state.isLoading) {
      // This flag is set to false once the play promise is resolved/rejected;
      // but does the promise always end?? How to force the promise to end if it gets stuck?
      // Don't do anything for now, just log a warning
      this.log.warn('Unable to stop. The audio is still loading.');
      this.resolveStop(false);
    }
    else if (this.state.status === PlayerStatus.Stopped) {
      // Changing the state resets the loading flag,
      // but in this scenario the state does not change,
      // so manually turn off the flag
      if (this.state.isStalled) {
        this.state.isStalled = false;
      }
      if (this.state.hasError) {
        this.state.hasError = false;
      }
      this.resolveStop(true);
    }
    // If the player is paused, it is also stopped so resolve immediately
    else if (this.state.status === PlayerStatus.Paused) {
      this.htmlAudio.currentTime = 0;
      this.onAudioStop();
      this.resolveStop(true);
    }
    // Do not resolve the promise, this will be resolved by the html "pause" event handler
    else {
      this.isManualPause = true;
      this.isStopping = true;
      this.htmlAudio.pause();
    }
    // Return the promise immediately, but it will be resolved later
    return stopPromise;
  }

  public pause() {
    if (this.state.isLoading) {
      this.log.warn('Unable to pause. The audio is still loading.');
    }
    else if (this.isPlaying()) {
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
   public playByTrack(track: IPlaylistSongModel): Promise<boolean> {
    if (this.state.isLoading) {
      // Do not allow to play another track if is still loading the previous one
      // Because we don't know how to stop the loading process (force the play promise to finish)
      this.log.warn('Unable to play. The audio is still loading.');
      return Promise.resolve(false);
    }
    if (this.state.status === PlayerStatus.Playing) {
      return this.stop().then(success => {
        if (success && this.setupNewTrack(track)) {
          return this.playAudio();
        }
        return false;
      });
    }

    if (this.state.status === PlayerStatus.Paused) {
      if (this.state.playerList.current.sequence === track.sequence) {
        return this.playAudio();
      }
      return this.stop().then(success => {
        if (success && this.setupNewTrack(track)) {
          return this.playAudio();
        }
        return false;
      });
    }

    if (this.setupNewTrack(track)) {
      return this.playAudio();
    }
    return Promise.resolve(false);
  }

  public playBySequence(sequence: number): Promise<boolean> {
    return this.playByTrack(this.getTrack(sequence));
  }

  public play(): Promise<boolean> {
    // Play error reference: https://developer.chrome.com/blog/play-request-was-interrupted/
    if (this.state.playerList.hasTrack()) {
      return this.playByTrack(this.state.playerList.current);
    }
    return Promise.resolve(false);
  }

  /**
   * Plays the first track of the list.
   */
  public playFirst(): Promise<boolean> {
    const firstTrack = this.state.playerList.getFirstTrack();
    if (firstTrack) {
      return this.playByTrack(firstTrack);
    }
    return Promise.resolve(false);
  }

  public playNext(): Promise<boolean> {
    if (this.state.playerList.next) {
      return this.stop().then(success => {
        if (success) {
          this.state.playerList.getNext();
          return this.play();
        }
        return false;
      });
    }
    return Promise.resolve(false);
  }

  /**
   * Plays the previous song in the list.
   * If the elapsed time exceeds the specified threshold the method will restart the track instead.
   * @param previousThreshold The maximum number of elapsed seconds to allow going back to the previous song.
   */
   public playPrevious(previousThreshold?: number): Promise<boolean> {
    if (previousThreshold && this.state.elapsedSeconds > previousThreshold) {
      // If elapsed time is beyond the threshold do not play previous, restart the song instead
      this.htmlAudio.currentTime = 0;
      return Promise.resolve(true);
    }

    if (this.state.playerList.previous) {
      return this.stop().then(success => {
        if (success) {
          this.state.playerList.getPrevious();
          return this.play();
        }
        return false;
      });
    }

    return Promise.resolve(false);
  }

  public togglePlay() {
    if (this.isPlaying()) {
      this.pause();
    }
    else {
      this.play();
    }
  }

  /**
   * Sets the specified track as the current track in the playlist.
   * This method assumes the track already belongs to the existing playlist.
   * If the specified track is already playing this method does nothing.
   */
   public async setCurrentTrack(track: IPlaylistSongModel, play?: boolean): Promise<void> {
    if (track === this.state.playerList.current) {
      // Play only if it is not playing
      if (play && this.state.status !== PlayerStatus.Playing) {
        await this.playAudio();
      }
    }
    else {
      // New track so stop the player and load the new one
      const success = await this.stop();
      if (success && this.setupNewTrack(track) && play) {
        await this.playAudio();
      }
    }
  }

  public adjustTime(seconds: number): void {
    this.htmlAudio.currentTime = seconds;
  }

  public adjustTimeUp(seconds: number): void {
    this.htmlAudio.currentTime += seconds;
  }

  public adjustTimeDown(seconds: number): void {
    this.htmlAudio.currentTime -= seconds;
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
        this.nav.mediaSession.metadata.title === track.name &&
        this.nav.mediaSession.metadata.artist === track.primaryArtistName &&
        this.nav.mediaSession.metadata.album === track.primaryAlbumName) {
          return;
    }

    // TODO: determine why TS doesn't recognize this
    // @ts-ignore
    this.nav.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.primaryArtistName,
      album: track.primaryAlbumName,
      artwork: [{
        src: track.image.src,
        // Does this work if it doesn't have the type (mime type)?
        // type: ''
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

  private clearEventMetadata() {
    this.eventHistory = [];
  }

  private isPlaying(): boolean {
    return this.state.status === PlayerStatus.Playing;
  }

  private cancelPlayTimer() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    // Play timer is responsible for updating the time
    // so make sure we refresh the time with the last status after the timer is canceled
    this.updateElapsedTime();
  }

  private restartPlayTimer() {
    this.cancelPlayTimer();

    this.playTimer = setInterval(() => {
      this.updateElapsedTime();
    }, this.state.playTimerInterval * 1000);
  }

  private updateElapsedTime() {
    this.state.previousElapsedSeconds = this.state.elapsedSeconds;
    this.state.previousElapsedPercentage = this.state.elapsedPercentage;
    const currentTime = this.htmlAudio.currentTime;
    const seconds = Math.round(currentTime);
    if (isNaN(seconds)) {
      this.state.elapsedSeconds = 0;
      this.state.elapsedPercentage = 0;
    }
    else {
      this.state.elapsedSeconds = seconds;
      if (this.state.playerList.hasTrack() && this.state.playerList.current.seconds > 0) {
        const percentage = seconds / this.state.playerList.current.seconds * 100;
        this.state.elapsedPercentage = percentage;
      }
      else {
        this.state.elapsedPercentage = 0;
      }
    }
    this.events.broadcast(AppEvent.PlayerPositionChanged, { oldValue: this.state.previousElapsedSeconds, newValue: this.state.elapsedSeconds });
    if (!this.played && this.state.elapsedPercentage >= this.state.playPercentage) {
      this.played = true;
      const countInfo: IPlayerTrackCount = {
        songId: this.state.playerList.current.songId,
        elapsedPercentage: Math.round(this.state.elapsedPercentage),
        count: 1
      };
      this.events.broadcast(AppEvent.PlayerTrackCount, countInfo);
    }
  }

  /**
   * Replaces the audio source with a new one and then loads it.
   * Make sure you call this method after the player is paused or stopped.
   * @param audioSrc The source of the audio to load.
   */
  private loadAudio(audioSrc: string): boolean {
    let loadSuccess = false;
    // the html audio will automatically perform an encodeURI on the src property after it is set
    // so the audioSrc should be already pre-encoded
    this.htmlAudio.src = audioSrc;
    try {
      this.htmlAudio.load();
      loadSuccess = true;
      this.registerEvent(HtmlMediaEvent.Custom, 'Load success');
    }
    catch (error) {
      this.log.error('Load audio error', error);
    }
    return loadSuccess;
  }

  private playAudio(startTime?: number): Promise<boolean> {
    if (startTime > 0) {
      this.htmlAudio.currentTime = startTime;
    }

    // This should be the only place where this flag is turned on/off
    this.state.isLoading = true;
    this.registerEvent(HtmlMediaEvent.Custom, 'Playing audio (loading started)');
    return this.htmlAudio.play().then(() => {
      this.registerEvent(HtmlMediaEvent.Custom, 'Play audio success (loading finished)');
      this.state.isLoading = false;
      return true;
    }).catch(error => {
      this.log.error('Play audio error (loading finished)', error);
      this.state.isLoading = false;
      return false;
    });
  }

  private onAudioEnded() {
    this.onAudioStop();
    if (this.state.playNextEnabled) {
      this.playNext();
    }
  }

  private onAudioStop() {
    this.beforeStop();
    this.cancelPlayTimer();
    this.setStatus(PlayerStatus.Stopped);
    this.resetTitle();
  }

  private onAudioPause() {
    this.cancelPlayTimer();
    this.setStatus(PlayerStatus.Paused);
    this.resetTitle();
  }

  private onAudioPlay() {
    this.restartPlayTimer();
    this.setStatus(PlayerStatus.Playing);
    this.setCurrentSongAsTitle();
    this.setMediaSessionMetadata();
  }

  private getSongTitle(track?: IPlaylistSongModel) {
    if (!track) {
      track = this.state.playerList.current;
    }
    if (track) {
      return `${track.name} - ${track.primaryArtistName}`;
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

  /**
   * Sets the specified track as current in the playlist
   * and loads the audio file into the internal player.
   */
  private setupNewTrack(track: IPlaylistSongModel): boolean {
    if (this.played) {
      // Reset the play flag
      this.played = false;
    }
    else if (this.state.playerList.hasTrack()) {
      // Using the previous percentage because at this point the song should have been stopped
      // and the current percentage should be 0
      const countInfo: IPlayerTrackCount = {
        songId: this.state.playerList.current.songId,
        elapsedPercentage: Math.round(this.state.previousElapsedPercentage),
        count: 0
      };
      // Before setting current, fire event if the track was not played
      this.events.broadcast(AppEvent.PlayerTrackCount, countInfo);
    }
    this.state.playerList.setCurrent(track);
    return this.loadAudio(this.utilities.fileToUrl(track.filePath));
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

    let newSongStatus: PlayerSongStatus;
    switch (this.state.status) {
      case PlayerStatus.Playing:
        newSongStatus = PlayerSongStatus.Playing;
        break;
      case PlayerStatus.Paused:
        newSongStatus = PlayerSongStatus.Paused;
        break;
      case PlayerStatus.Stopped:
        newSongStatus = PlayerSongStatus.Paused;
        break;
    }

    if (newSongStatus && newSongStatus !== this.state.playerList.current.playerStatus) {
      const oldSongStatus = this.state.playerList.current.playerStatus;
      this.state.playerList.current.playerStatus = newSongStatus;
      if (this.state.playerList.doAfterSongStatusChange) {
        this.state.playerList.doAfterSongStatusChange(this.state.playerList.current, oldSongStatus);
      }
    }
    const eventArgs: IPlayerStatusChangedEventArgs = {
      oldValue: oldStatus,
      newValue: this.state.status,
      track: this.state.playerList.current
    };
    this.events.broadcast(AppEvent.PlayerStatusChanged, eventArgs);
  }

  private beforeStop(): void {
    this.clearEventMetadata();
  }

  private subscribeToAudioEvents() {
    this.htmlAudio.addEventListener(HtmlMediaEvent.TimeUpdate, () => {
      if (this.htmlAudio.currentTime) {
        // this.log.debug('timeupdate ' + this.htmlAudio.currentTime);
      }
      else {
        this.registerEvent(HtmlMediaEvent.TimeUpdate, '01 - time has been set to 0');
      }
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Play, () => {
      this.registerEvent(HtmlMediaEvent.Play, '02 - play action has been called');
      // this.state.isLoading = true;
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
      this.registerEvent(HtmlMediaEvent.Playing, '07 - playing audio');
      this.onAudioPlay();
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.CanPlayThrough, () => {
      this.registerEvent(HtmlMediaEvent.CanPlayThrough, '08 - no issues on continuos playing');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Progress, () => {
      this.registerEvent(HtmlMediaEvent.Progress, 'Downloading chunk');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Suspend, () => {
      this.registerEvent(HtmlMediaEvent.Suspend, 'Chunk downloaded');
    });

    this.htmlAudio.addEventListener(HtmlMediaEvent.Pause, () => {
      const currentTime = this.htmlAudio.currentTime;
      // An automatic pause event happens just before the ended event
      // or if the user pauses outside the app, for instance, when pausing using
      // the audio controls in the lock screen of the device
      if (this.isManualPause) {
        this.registerEvent(HtmlMediaEvent.Pause, 'Manual pause at: ' + currentTime.toString());
          this.isManualPause = false;
          if (this.isStopping) {
              this.isStopping = false;
              // Stop and Pause both pauses the player, but stop also moves the time back to 0
              this.htmlAudio.currentTime = 0;
              this.onAudioStop();
              if (this.resolveStop) {
                this.resolveStop(true);
              }
          }
          else {
              this.onAudioPause();
          }
      }
      else {
          if (currentTime < this.state.playerList.current.seconds) {
              // If this happens let's assume the song was paused by an external action
              this.onAudioPause();
              this.registerEvent(HtmlMediaEvent.Pause, 'External pause at: ' + currentTime.toString());
          }
          else {
            // Otherwise, this is an auto pause that will lead to a ended event, in this case do nothing here
            this.registerEvent(HtmlMediaEvent.Pause, 'Auto pause (ending audio) at: ' + currentTime.toString());
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
      this.registerEvent(HtmlMediaEvent.Abort, 'No need to load more audio for now');
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
          // TODO: should we reset the isLoading flag to allow a new reload of the audio?
          this.registerEvent(HtmlMediaEvent.Custom, 'Too much time loading or stalled, attempting restart');
          this.stop().then(success => {
            if (success) {
              this.play();
            }
            else {
              // Force stop, reset isLoading flag
              // Should we use same song or move to the next one?
            }
          });
        }
      }, waitTime * 1000);
    }
  }
}
