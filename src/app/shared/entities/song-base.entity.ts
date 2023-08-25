import { IIcon } from "src/app/core/models/core.interface";
import { PlayerSongStatus } from "../models/player.enum";
import { ListItemEntity } from "./base.entity";

/**
 * Base class that includes some properties of the ISongModel interface.
 * It does not actually implement the full interface since the properties would
 * need decorators that depend on the parent class.
 */
export class SongBaseEntity extends ListItemEntity {
  // Join info
  primaryAlbumName: string;
  primaryArtistId: string;
  primaryArtistName: string;
  primaryArtistStylized: string;
  // Optional info
  artistId: string;
  classificationId: string;
  playlistId: string;

  // Data not saved
  playerStatus = PlayerSongStatus.Empty;
  recentPlayIcon?: IIcon;
}