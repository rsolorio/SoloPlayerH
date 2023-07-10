import { Injectable } from '@angular/core';
import * as objectHash from 'object-hash'
import { AlbumEntity, ArtistEntity, DbEntity, ModuleOptionEntity, PartyRelationEntity, PlaylistEntity, RelatedImageEntity, SongEntity, ValueListEntryEntity } from '../../entities';
import { PartyRelationType } from '../../models/music.enum';
import { IImageSource } from 'src/app/core/models/core.interface';

@Injectable({
  providedIn: 'root'
})
export class DatabaseLookupService {

  constructor() { }

  public hashValues(values: string[]): string {
    const hashSeparator = '|';
    const value = values.join(hashSeparator);
    // Defaults to sha1 with hex encoding
    return objectHash(value);
  }

  public exists(id: string, entityType: typeof DbEntity): Promise<boolean> {
    return entityType.findOneBy({ id }).then(entity => {
      return entity !== null;
    });
  }

  // ARTIST
  public hashArtist(name: string): string {
    return this.hashValues([name.toLowerCase()]);
  }

  public findArtist(name: string, items: ArtistEntity[]): ArtistEntity {
    const hash = this.hashArtist(name);
    return items.find(i => i.hash === hash);
  }

  public lookupArtist(name: string): Promise<ArtistEntity> {
    return ArtistEntity.findOneBy({ name: name });
  }

  // ALBUM
  public hashAlbum(name: string, releaseYear: number): string {
    return this.hashValues([name.toLowerCase(), releaseYear.toString()]);
  }

  public findAlbum(name: string, releaseYear: number, primaryArtistId: string, items: AlbumEntity[]): AlbumEntity {
    const hash = this.hashAlbum(name, releaseYear);
    return items.find(i => i.hash === hash && i.primaryArtistId === primaryArtistId);    
  }

  public async lookupAlbum(name: string, releaseYear: number, primaryArtistId: string): Promise<AlbumEntity> {
    return AlbumEntity.findOneBy({ name: name, releaseYear: releaseYear, primaryArtistId: primaryArtistId });
  }

  // SONG
  public hashSong(filePath: string): string {
    return this.hashValues([filePath.toLowerCase()]);
  }

  public findSong(filePath: string, items: SongEntity[]): SongEntity {
    const hash = this.hashSong(filePath);
    return items.find(i => i.hash === hash);
  }

  public async lookupSong(filePath: string): Promise<SongEntity> {
    return SongEntity.findOneBy({ filePath: filePath });
  }

  // PLAYLIST
  public hashPlaylist(name: string): string {
    return this.hashValues([name.toLowerCase()]);
  }

  public findPlaylist(name: string, items: PlaylistEntity[]): PlaylistEntity {
    const hash = this.hashPlaylist(name);
    return items.find(i => i.hash === hash);    
  }

  public async lookupPlaylist(name: string): Promise<PlaylistEntity> {
    return PlaylistEntity.findOneBy({ name: name });
  }

  // MODULE OPTION
  public hashModuleOption(name: string): string {
    return this.hashValues([name.toLowerCase()]);
  }

  public findModuleOption(name: string, items: ModuleOptionEntity[]): ModuleOptionEntity {
    const hash = this.hashModuleOption(name);
    return items.find(i => i.hash === hash);
  }

  public async lookupModuleOption(name: string): Promise<ModuleOptionEntity> {
    return ModuleOptionEntity.findOneBy({ name: name });
  }

  // VALUE LIST ENTRY
  public hashValueListEntry(name: string): string {
    return this.hashValues([name.toLowerCase()]);
  }

  public findValueListEntry(name: string, valueListTypeId: string, items: ValueListEntryEntity[]): ValueListEntryEntity {
    const hash = this.hashValueListEntry(name);
    if (valueListTypeId === null) {
      return items.find(i => i.hash === hash);
    }
    return items.find(i => i.hash === hash && i.valueListTypeId === valueListTypeId);
  }

  public async lookupValueListEntry(name: string, valueListTypeId: string): Promise<ValueListEntryEntity> {
    return ValueListEntryEntity.findOneBy({ name: name, valueListTypeId: valueListTypeId});
  }

  // PARTY RELATIONS
  public findSingerRelation(relatedId: string, artistId: string, items: PartyRelationEntity[]): PartyRelationEntity {
    return items.find(r => r.relatedId === relatedId && r.artistId === artistId && r.relationTypeId === PartyRelationType.Singer);
  }

  public findContributorRelation(relatedId: string, artistId: string, items: PartyRelationEntity[]): PartyRelationEntity {
    return items.find(r => r.relatedId === relatedId && r.artistId === artistId && r.relationTypeId === PartyRelationType.Contributor);
  }

  // RELATED IMAGE
  public findImage(relatedId: string, imageSource: IImageSource, items: RelatedImageEntity[]): RelatedImageEntity {
    return items.find(i =>
      i.relatedId === relatedId &&
      i.sourceType === imageSource.sourceType &&
      i.sourceIndex === imageSource.sourceIndex &&
      i.sourcePath === imageSource.sourcePath);
  }
}
