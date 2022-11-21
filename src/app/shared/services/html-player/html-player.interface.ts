import { HtmlMediaEvent, HtmlMediaNetworkState } from "./html-player.enum";

/**
 * Just a generic interface to facilitate the use of the html audio tag
 */
 export interface IHtmlAudio {
  currentTime: any;
  networkState: any;
  error?: MediaError;
  pause();
  load();
  play();
  addEventListener(eventName: string, callback: any);
}

export interface IMediaEventEntry {
  event: HtmlMediaEvent;
  timestamp: string;
  message?: string;
  networkState?: HtmlMediaNetworkState;
  error?: MediaError;
}

export interface IHtmlPlayerEventMetadata {
  title: string;
  eventHistory: IMediaEventEntry[];
}
