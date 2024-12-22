import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { md5 } from 'src/app/core/models/md5';
import { ILastFmArtistResponse, ILastFmImage, ILastFmScrobbleResponse, ILastFmSessionResponse } from './last-fm.interface';
import { LocalStorageService } from '../local-storage/local-storage.service';
import { LocalStorageKeys } from '../local-storage/local-storage.enum';
import { appName } from 'src/app/app-exports';
import { LastFmImageSize } from './last-fm.enum';

/**
 * Service that provides access to the Last.Fm API.
 * https://www.last.fm/api
 */
@Injectable({
  providedIn: 'root'
})
export class LastFmService {
  private rootUrl = 'https://ws.audioscrobbler.com/2.0/';
  private apiKey = '6cc6247a75dde261c542a06a3f8e544e';
  private apiSecret = '';
  private user = '';
  private pwd = '';
  private sessionKey = '';
  private responseFormat = 'json';
  constructor(
    private http: HttpClient,
    private storage: LocalStorageService
  ) { }

  public setupAuthentication(username: string, password: string, secret: string): void {
    this.user = username;
    this.pwd = password;
    this.apiSecret = secret;
  }

  /**
   * https://www.last.fm/api/show/track.scrobble
   * https://www.last.fm/api/scrobbling
   * .net api: https://github.com/inflatablefriends/lastfm/blob/next/doc/scrobbling.md
   * Last.fm does not accept scrobbles which are older than two weeks (UTC);
   * there's no point sending them, so scrobbles older than two weeks will be silently dropped.
   * There must be at least 30 seconds in between each scrobble;
   * this means you may scrobble at most (24 * 60 * 60) / 30 = 2880 tracks in one day.
   * The Last.fm API supports up to 50 scrobbles being sent at a time but this method only allows one at a time.
   */
  public scrobble(albumArtist: string, artist: string, track: string, album: string): Observable<ILastFmScrobbleResponse> {
    return this.setupSessionKey(this.user, this.pwd).pipe(
      mergeMap(() => {
        let params = this.buildBasicHttpParams('track.scrobble');
        params = this.appendMusicInfo(params, albumArtist, artist, track, album);
        params = this.appendTimestamp(params);
        params = this.appendSessionKey(params);
        params = this.appendSignature(params);
        params = this.appendFormat(params);
        return this.http.post<ILastFmScrobbleResponse>(this.rootUrl, null, { params: params });
      })
    );
  }

  /**
   * https://www.last.fm/api/show/track.updateNowPlaying
   */
  public nowPlaying(albumArtist: string, artist: string, track: string, album: string): Observable<any> {
    return this.setupSessionKey(this.user, this.pwd).pipe(
      mergeMap(() => {
        let params = this.buildBasicHttpParams('track.updateNowPlaying');
        params = this.appendMusicInfo(params, albumArtist, artist, track, album);
        params = this.appendSessionKey(params);
        params = this.appendSignature(params);
        params = this.appendFormat(params);
        return this.http.post<any>(this.rootUrl, null, { params: params });
      })
    );
  }

  /**
   * https://www.last.fm/api/show/artist.getInfo
   */
  public getArtist(artistName: string): Observable<ILastFmArtistResponse> {
    let params = this.buildBasicHttpParams('artist.getinfo');
    params = this.appendArtist(params, artistName);
    params = this.appendAuth(params, this.user);
    params = this.appendFormat(params);
    return this.http.get<ILastFmArtistResponse>(this.rootUrl, { params: params });
  }

  public getArtistImageUrl(artistName: string, imageSize?: LastFmImageSize): Observable<string> {
    return this.getArtist(artistName).pipe(
      map(artistResponse => this.getImageUrl(artistResponse.artist.image, imageSize))
    );
  }

  /**
   * Ensures the sessionKey variable is set.
   */
  private setupSessionKey(username: string, password: string): Observable<void> {
    if (this.sessionKey) {
      return of(void 0);
    }
    const key = this.storage.getByKey<string>(LocalStorageKeys.LastFmSessionKey);
    if (key) {
      this.sessionKey = key;
      return of(void 0);
    }
    return this.getMobileSession(username, password).pipe(
      map(response => {
        this.storage.setByKey(LocalStorageKeys.LastFmSessionKey, response.session.key);
        this.sessionKey = response.session.key;
      })
    );
  }

  /**
   * https://www.last.fm/api/show/auth.getMobileSession
   */
  private getMobileSession(username: string, password: string): Observable<ILastFmSessionResponse> {
    let params = this.buildBasicHttpParams('auth.getMobileSession');
    params = this.appendAuth(params, username, password);
    params = this.appendSignature(params);
    // This parameter should not be part of the signature
    params = this.appendFormat(params);
    return this.http.post<ILastFmSessionResponse>(this.rootUrl, null, { params: params });
  }

  private buildBasicHttpParams(method: string): HttpParams {
    let params = new HttpParams();
    params = params.append('api_key', this.apiKey);
    params = params.append('method', method);
    return params;
  }

  private appendAuth(httpParams: HttpParams, userName: string, password?: string): HttpParams {
    let params = httpParams.append('username', userName);
    if (password) {
      params = params.append('password', password);
    }
    return params;
  }

  private appendMusicInfo(httpParams: HttpParams, albumArtist: string, artist: string, track: string, album: string): HttpParams {
    let params = httpParams.append('artist', artist);
    params = params.append('track', track);
    params = params.append('album', album);
    params = params.append('albumArtist', albumArtist);
    params = params.append('context', appName);
    return params;
  }

  private appendArtist(httpParams: HttpParams, artistName: string, mbid?: string) {
    if (mbid) {
      return httpParams.append('mbid', mbid);
    }
    return httpParams.append('artist', artistName);
  }

  private appendTimestamp(httpParams: HttpParams): HttpParams {
    const unix = Math.floor(Date.now() / 1000);
    return httpParams.append('timestamp', unix.toString());
  }

  private appendSessionKey(httpParams: HttpParams): HttpParams {
    return httpParams.append('sk', this.sessionKey);
  }

  private appendSignature(httpParams: HttpParams): HttpParams {
    return httpParams.append('api_sig', this.generateApiSignature(httpParams));
  }

  private appendFormat(httpParams: HttpParams): HttpParams {
    return httpParams.append('format', this.responseFormat);
  }

  private generateApiSignature(params: HttpParams): string {
    const sortedKeys = params.keys().sort();
    let signatureString = '';

    sortedKeys.forEach(key => {
      signatureString += key + params.get(key);
    });
    signatureString += this.apiSecret;
    return md5(signatureString);
  }

  private getImageUrl(imageList: ILastFmImage[], imageSize?: LastFmImageSize): string {
    if (!imageSize) {
      imageSize = LastFmImageSize.Default;
    }

    if (imageList) {
      for (const image of imageList) {
        if (image.size === imageSize) {
          return image['#text'];
        }
      }
    }

    return null;
  }
}
