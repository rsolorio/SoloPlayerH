import { Component, OnInit, ViewChild } from '@angular/core';
import { LoadingViewStateService } from 'src/app/core/components/loading-view/loading-view-state.service';
import { NavBarStateService } from 'src/app/core/components/nav-bar/nav-bar-state.service';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { IMenuModel } from 'src/app/core/models/menu-model.interface';
import { AppRoutes } from 'src/app/core/services/utility/utility.enum';
import { UtilityService } from 'src/app/core/services/utility/utility.service';
import { ListBaseComponent } from 'src/app/shared/components/list-base/list-base.component';
import { IClassificationModel } from 'src/app/shared/models/classification-model.interface';
import { ICriteriaValueBaseModel } from 'src/app/shared/models/criteria-base-model.interface';
import { CriteriaValueBase } from 'src/app/shared/models/criteria-base.class';
import { AppEvent } from 'src/app/shared/models/events.enum';
import { BreadcrumbSource } from 'src/app/shared/models/music-breadcrumb-model.interface';
import { MusicBreadcrumbsStateService } from '../music-breadcrumbs/music-breadcrumbs-state.service';
import { MusicBreadcrumbsComponent } from '../music-breadcrumbs/music-breadcrumbs.component';
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
    private broadcastService: ClassificationListBroadcastService,
    private utility: UtilityService,
    private loadingService: LoadingViewStateService,
    private breadcrumbsService: MusicBreadcrumbsStateService,
    private navbarService: NavBarStateService
  ) {
    super();
    this.isGenreList = this.utility.isRouteActive(AppRoutes.Genres);
    this.broadcastService.isGenreList = this.isGenreList;
  }

  ngOnInit(): void {
    this.initializeNavbar();
    this.initializeItemMenu();
    this.removeUnsupportedBreadcrumbs();
  }

  private initializeNavbar(): void {
    const navbar = this.navbarService.getState();
    navbar.title = this.isGenreList ? 'Genres' : 'Classifications';
    navbar.onSearch = searchTerm => {
      this.loadingService.show();
      this.broadcastService.search(searchTerm).subscribe();
    };
    navbar.show = true;
    navbar.leftIcon = {
      icon: this.isGenreList ? 'mdi-tag-outline mdi' : 'mdi-tag-multiple-outline mdi'
    };
    navbar.componentType = this.breadcrumbsService.hasBreadcrumbs() ? MusicBreadcrumbsComponent : null;
  }

  private initializeItemMenu(): void {
    this.itemMenuList.push({
      caption: 'Play',
      icon: 'mdi-play mdi',
      action: param => {}
    });

    this.itemMenuList.push({
      caption: 'Select',
      icon: 'mdi-select mdi',
      action: param => {
        const classification = param as IClassificationModel;
        classification.selected = true;
      }
    });

    this.itemMenuList.push({
      isSeparator: true,
      caption: null
    });

    this.itemMenuList.push({
      caption: 'Album Artists',
      icon: 'mdi-account-music mdi',
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showAlbumArtists(classification);
        }
      }
    });

    this.itemMenuList.push({
      caption: 'Albums',
      icon: 'mdi-album mdi',
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showAlbums(classification);
        }
      }
    });

    this.itemMenuList.push({
      caption: 'Songs',
      icon: 'mdi-music-note mdi',
      action: param => {
        const classification = param as IClassificationModel;
        if (classification) {
          this.showSongs(classification);
        }
      }
    });
  }

  public onItemContentClick(classification: IClassificationModel): void {
    this.onClassificationClick(classification);
  }

  private onClassificationClick(classification: IClassificationModel): void {
    this.showAlbumArtists(classification);
  }

  private addBreadcrumb(classification: IClassificationModel): void {
    const criteria: ICriteriaValueBaseModel[] = [];
    const criteriaValue = new CriteriaValueBase('classificationId', classification.id);
    criteriaValue.IgnoreInSelect = true;
    criteria.push(criteriaValue);
    const selectedItems = this.spListBaseComponent.getSelectedItems();
    if (selectedItems.length) {
      for (const item of selectedItems) {
        const criteriaItem = new CriteriaValueBase('classificationId', item.id);
        criteriaItem.IgnoreInSelect = true;
        criteria.push(criteriaItem);
      }
    }
    this.breadcrumbsService.add({
      caption: classification.name,
      criteriaList: criteria,
      source: BreadcrumbSource.Classification
    });
  }

  private showAlbumArtists(classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    this.utility.navigate(AppRoutes.AlbumArtists);
  }

  private showAlbums(classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    this.utility.navigate(AppRoutes.Albums);
  }

  private showSongs(classification: IClassificationModel): void {
    this.addBreadcrumb(classification);
    this.utility.navigate(AppRoutes.Songs);
  }

  public onInitialized(): void {
    this.loadingService.show();
    this.broadcastService.search().subscribe();
  }

  private removeUnsupportedBreadcrumbs(): void {
    // Classifications/genres do not support any kind of breadcrumbs
    this.breadcrumbsService.clear();
  }

}
