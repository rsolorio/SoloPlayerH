import { ListEntity } from "./base.entity";

/**
 * Base class that includes some properties of the ISongModel interface.
 * It does not actually implement the full interface since the properties would
 * need decorators that depend on the parent class.
 */
export class SongBaseEntity extends ListEntity {
  releaseYear: number;
  albumName: string;
  artistName: string;
  playCount: number;

  public get albumWithYear(): string {
    const yearText = this.releaseYear >= 0 ? ` (${this.releaseYear})` : '';
    return this.albumName + yearText;
  }

  public get playCountText(): string {
    return this.playCount > 0 ? this.playCount.toString() : '';
  }
}