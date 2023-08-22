import { Injectable } from '@angular/core';

/**
 * Service to copy audio and playlist files to other locations.
 */
@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Configurations:
   * 0. Empty folder, or real sync add/replace/remove (profile config)
   * 1. Audio directory: the destination path (profile property)
   * 2. Copy All? (data source config)
   * 3a. Copy all: yes
   * 3a1. Export playlists? If so, specify playlist directory, playlist format (profile config)
   * 3a2. Export smartlists as playlists (profile config)
   * 3b: Copy all: no
   * 3b1. Select data to export: playlist, filter? list of artists? current song list (criteria), Max songs. (data source config)
   * 3b2. Export smartlists as playlists
   * 3b3. Auto playlists (profile config)
   * 3b4. Select/update mappings? How to choose other mappings without changing existing ones.
   * 4. Save results in profile, Sync history?
   */
  public copyAndTag(): void {

  }
}
