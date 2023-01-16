import { HtmlMediaEvent, HtmlMediaNetworkState } from "./html-player.enum";

export interface IMediaEventEntry {
  event: HtmlMediaEvent;
  timestamp: string;
  message?: string;
  networkState?: HtmlMediaNetworkState;
  error?: MediaError;
}

export interface IHtmlPlayerEventMetadata {
  title: string;
  src?: string;
  eventHistory: IMediaEventEntry[];
}
