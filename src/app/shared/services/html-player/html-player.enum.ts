/**
 * Media events:
   https://www.w3schools.com/tags/ref_av_dom.asp
   https://html.spec.whatwg.org/multipage/media.html#media-elements
   Order of events after calling play:
   timeupdate [usually current time set to 0]
   play
   loadstart
   progress [first chunk of data being downloaded]
   suspend [stopped on purpose to finish downloading the first chunk]
   durationchange [the first chunk contains info about the duration]
   loadeddata
   canplay
   playing
   canplaythrough
   progress [usually a second chunk]
   timeupdate
   progress [there can be more chunks afterwards]
 */
   export enum HtmlMediaEvent {
    /**
     * Fires when the current playback position has changed.
     * Documentation does not clearly states how often this happens;
     * it seems that runs every chunk of data (aprox. 3 times a second).
     */
    TimeUpdate = 'timeupdate',
    /**
     * Fires when the audio has been started or is no longer paused.
     * In other words, it is fired when the play action has been called;
     * this does not mean that it is actually playing, but trying to play.
     */
    Play = 'play',
    /**
     * Fires when the browser starts looking for the audio.
     */
    LoadStart = 'loadstart',
    /**
     * Fires when the duration of the audio is changed.
     */
    DurationChange = 'durationchange',
    /**
     * Fires when the browser has loaded the current frame of the audio.
     */
    LoadedData = 'loadeddata',
    /**
     * Fires when the browser can start playing the audio.
     */
    CanPlay = 'canplay',
    /**
     * Fires when the audio is playing after having been paused or stopped for buffering.
     * This happens indeed when the media is actually playing.
     */
    Playing = 'playing',
    /**
     * Fires when the browser can play through the audio without stopping for buffering.
     */
    CanPlayThrough = 'canplaythrough',
    /**
     * Fires when the browser is downloading the audio.
     * Since media is usually downloaded in chunks,
     * this event is fired every time a chunk is downloaded.
     * You can see this reflected in the endpoint that returns the media;
     * the endpoint does not usually return the whole media at once.
     */
    Progress = 'progress',
    /**
     * Fires when the browser is intentionally not getting media data.
     * Since the browser automatically determines the size of the chunk,
     * the endpoint that is returning the media is automatically suspended
     * and then at some point resumed to get another chunk.
     */
    Suspend = 'suspend',
    /**
     * Fires when the audio has been paused.
     */
    Pause = 'pause',
    /**
     * Fires when the current playlist is ended.
     */
    Ended = 'ended',
    /**
     * Fires when the audio/video stops because it needs to buffer the next frame.
     */
    Stops = 'stops',
    /**
     * Fires when the browser is trying to get media data, but data is not available.
     * Where?
     * If there's a problem with the 'loadstart' event.
     * If the chunk is not loaded after the 'loadstart' event,
     * instead of getting a 'durationchange' this event will be fired.
     */
    Stalled = 'stalled',
    /**
     * Fires when an error occurred during the loading of an audio.
     */
    Error = 'error',
    /**
     * Fires when the loading of an audio is aborted.
     * The browser aborts the loading process when it detects the audio ended.
     */
    Abort = 'abort',
    /**
     * According to the doc, it happens when there was a fatal error during load.
     */
    Emptied = 'emptied',
    /**
     * This is not an actual media event, but just a generic entry to be used
     * for any other action happening in the player.
     */
    Custom = 'custom'
}

/**
 * Enum that represents the network state of the media.
 * https://html.spec.whatwg.org/multipage/media.html#network-states
 */
export enum HtmlMediaNetworkState {
  /**
   * The element has not yet been initialized. All attributes are in their initial states.
   */
  Empty = 0,
  /**
   * The element's resource selection algorithm is active and has selected a resource,
   * but it is not actually using the network at this time.
   */
  Idle = 1,
  /**
   * The user agent is actively trying to download data.
   */
  Loading = 2,
  /**
   * The element's resource selection algorithm is active, but it has not yet found a resource to use.
   */
  NoSource = 3
}

/**
 * A list of events supported by the MediaSession.setActionHandler.
 * https://developer.mozilla.org/en-US/docs/Web/API/MediaSession/setActionHandler
 */
export enum HtmlMediaSessionEvent {
  PreviousTrack = 'previoustrack',
  NextTrack = 'nexttrack',
  Play = 'play',
  Pause = 'pause',
  Stop = 'stop',
  SeekBackward = 'seekbackward',
  SeekForward = 'seekforward',
  SeekTo = 'seekto',
  SkipAd = 'skipad'
}
