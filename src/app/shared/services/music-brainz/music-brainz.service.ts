import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IMbSearchResponse } from './music-brainz.interface';

/**
 * Service that provides access to the MusicBrainz API.
 * https://musicbrainz.org/doc/MusicBrainz_API
 * Info about rate limiting:
 * https://wiki.musicbrainz.org/MusicBrainz_API/Rate_Limiting
 * In summary, only one request per second is allowed.
 */
@Injectable({
  providedIn: 'root'
})
export class MusicBrainzService {
  private rootUrl = 'https://musicbrainz.org/ws/2/';
  constructor(private http: HttpClient) { }

  /**
   * https://musicbrainz.org/doc/MusicBrainz_API/Search#Recording
   * @param title 
   * @param artistName 
   * @param albumName 
   * @returns 
   */
  public searchTrack(title: string, artistName?: string, albumName?: string): Promise<IMbSearchResponse> {
    let url = `${this.rootUrl}recording/?query=`;
    let query = `"${title}"`;
    if (artistName) {
      query += ` AND artistname:"${artistName}"`;
    }
    if (albumName) {

      query += ` AND release:"${albumName}"`;
    }
    url += encodeURI(query);
    return this.http.get<IMbSearchResponse>(url).toPromise();
  }
}
