import { Component, OnInit, ViewChild } from '@angular/core';
import { AppRoute, appRoutes, IAppRouteInfo } from 'src/app/app-routes';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { PromiseQueueService } from 'src/app/core/services/promise-queue/promise-queue.service';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { BreadcrumbsStateService } from 'src/app/shared/components/breadcrumbs/breadcrumbs-state.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { SongClassificationViewEntity } from 'src/app/shared/entities';
import { BreadcrumbSource } from 'src/app/shared/models/breadcrumbs.enum';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { Criteria, CriteriaItem } from 'src/app/shared/services/criteria/criteria.class';
import { DatabaseService } from 'src/app/shared/services/database/database.service';
import { FileService } from 'src/app/platform/file/file.service';
import { MusicImageType } from 'src/app/platform/audio-metadata/audio-metadata.enum';
import { AudioMetadataService } from 'src/app/platform/audio-metadata/audio-metadata.service';
import { NavigationService } from 'src/app/shared/services/navigation/navigation.service';
import { ClassificationListBroadcastService } from './classification-list-broadcast.service';

@Component({
  selector: 'sp-classification-list',
  templateUrl: './classification-list.component.html',
  styleUrls: ['./classification-list.component.scss']
})
export class ClassificationListComponent extends CoreComponent implements OnInit {
  @ViewChild('spListBaseComponent') private spListBaseComponent: ListBaseComponent;
  public appEvent = AppEvent;
  public itemMenuList: IMenuModel[] = [];
  public isGenreList = false;

  constructor(
    public broadcastService: ClassificationListBroadcastService,
    private utility: UtilityService,
    private breadcrumbService: BreadcrumbsStateService,
    private navigation: NavigationService,
    private queueService: PromiseQueueService,
    private db: DatabaseService,
    private fileService: FileService,
    private metadataService: AudioMetadataService
  ) {
    super();
    this.isGenreList = this.utility.isRouteActive(AppRoute.Genres);
    this.broadcastService.isGenreList = this.isGenreList;
  }

  ngOnInit(): void {
    this.initializeItemMenu();
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Select/Unselect',
      icon: 'mdi-select mdi',
      action: param => {
        const classification = param as IClassificationModel;
        classification.selected = !classification.selected;
      }
    });

    this.itemMenuList.push({
      isSeparator: true,
      caption: null
    });

    const albumArtistRoute = appRoutes[AppRoute.AlbumArtists];
    this.itemMenuList.push({
      caption: albumArtistRoute.name,
      icon: albumArtistRoute.icon,
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showEntity(albumArtistRoute, classification);
        }
      }
    });

    const albumRoute = appRoutes[AppRoute.Albums];
    this.itemMenuList.push({
      caption: albumRoute.name,
      icon: albumRoute.icon,
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showEntity(albumRoute, classification);
        }
      }
    });

    const songRoute = appRoutes[AppRoute.Songs];
    this.itemMenuList.push({
      caption: songRoute.name,
      icon: songRoute.icon,
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showEntity(songRoute, classification);
        }
      }
    });
  }

  public onItemContentClick(classification: IClassificationModel): void {
    this.onClassificationClick(classification);
  }

  private onClassificationClick(classification: IClassificationModel): void {
    this.showEntity(appRoutes[AppRoute.AlbumArtists], classification);
  }

  public onShowSongsClick(classification: IClassificationModel): void {
    this.showEntity(appRoutes[AppRoute.Songs], classification);
  }

  private addBreadcrumb(classification: IClassificationModel): void {
    const criteriaItem = new CriteriaItem('classificationId', classification.id);
    criteriaItem.displayName = classification.classificationType;
    criteriaItem.columnValues[0].caption = classification.name;
    criteriaItem.ignoreInSelect = true;
    const selectedItems = this.spListBaseComponent.getSelectedItems();
    if (selectedItems.length) {
      for (const item of selectedItems) {
        const classificationItem = item as IClassificationModel;
        criteriaItem.columnValues.push({
          value: classificationItem.id,
          caption: classificationItem.name
        });
      }
    }
    // Suppress event so this component doesn't react to this change;
    // these breadcrumbs are for another list that hasn't been loaded yet
    this.breadcrumbService.addOne({
      criteriaItem: criteriaItem,
      origin: BreadcrumbSource.Classification
    }, { suppressEvents: true });
  }

  private showEntity(routeInfo: IAppRouteInfo, classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    // No specific criteria, breadcrumbs will be automatically taken by the new entity
    const criteria = new Criteria('Search Results');
    this.navigation.forward(routeInfo.route, { criteria: criteria });
  }

  public onItemRender(classification: IClassificationModel): void {
    if (classification.image.src) {
      return;
    }
    this.queueService.sink = () => this.setClassificationImage(classification);
  }

  private async setClassificationImage(classification: IClassificationModel): Promise<void> {
    // Get one random song with this classification
    const criteria = new Criteria('Search Results');
    criteria.random = true;
    criteria.paging.pageSize = 1;
    const criteriaValue = new CriteriaItem('classificationId', classification.id);
    criteria.searchCriteria.push(criteriaValue);
    const songList = await this.db.getList(SongClassificationViewEntity, criteria);
    if (songList && songList.length) {
      // Get any of the songs associated with the album
      const song = songList[0];
      const buffer = await this.fileService.getBuffer(song.filePath);
      const audioInfo = await this.metadataService.getMetadata(buffer);
      const pictures = this.metadataService.getPictures(audioInfo.metadata, [MusicImageType.Single, MusicImageType.Front]);
      classification.image = this.metadataService.getImage(pictures);
    }
  }

  public onListInitialized(): void {
  }
}
