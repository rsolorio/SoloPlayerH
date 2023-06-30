import { IAlbumModel } from "../models/album-model.interface";
import { PlayerSongStatus } from "../models/player.enum";
import { ListItemEntity } from "./base.entity";

/**
 * Base class that includes some properties of the ISongModel interface.
 * It does not actually implement the full interface since the properties would
 * need decorators that depend on the parent class.
 */
export class SongBaseEntity extends ListItemEntity {
  releaseYear: number;
  primaryAlbumName: string;
  primaryArtistName: string;
  primaryArtistStylized: string;
  playCount: number;
  playerStatus: PlayerSongStatus;
  primaryAlbum: IAlbumModel;

  public get albumName(): string {
    if (this.primaryAlbum) {
      return this.primaryAlbum.name;
    }
    return this.primaryAlbumName;
  }

  public get artistName(): string {
    if (this.primaryAlbum && this.primaryAlbum.primaryArtist) {
      return this.primaryAlbum.primaryArtist.name;
    }
    return this.primaryArtistName;
  }

  public get artistStylized(): string {
    if (this.primaryAlbum && this.primaryAlbum.primaryArtist) {
      return this.primaryAlbum.primaryArtist.artistStylized;
    }
    return this.primaryArtistStylized;
  }

  public get albumWithYear(): string {
    const yearText = this.releaseYear > 0 ? ` (${this.releaseYear})` : '';
    return this.albumName + yearText;
  }

  public get playCountText(): string {
    return this.playCount > 0 ? this.playCount.toString() : '';
  }
}