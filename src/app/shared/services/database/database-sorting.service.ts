import { Injectable } from '@angular/core';
import { ChipDisplayMode, ChipSelectorType, IChipItem, IChipSelectionModel } from '../../components/chip-selection/chip-selection-model.interface';
import { ChipSelectionComponent } from '../../components/chip-selection/chip-selection.component';
import { Criteria, CriteriaItems } from '../criteria/criteria.class';
import { CriteriaSortDirection } from '../criteria/criteria.enum';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseSortingService {

  constructor(private sidebarHostService: SideBarHostStateService) { }

  public getSortingPanelModel(chips: IChipItem[], subTitle: string, subTitleIcon: string): IChipSelectionModel {
    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Sort',
      titleIcon: 'mdi-sort mdi',
      subTitle: subTitle,
      subTitleIcon: subTitleIcon,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Quick,
      items: chips,
      okHidden: true,
      okDelay: 300,
      onChipClick: (selectionChanged, chipItem, model) => {
        const criteriaItems = chipItem.value as CriteriaItems;
        // If the user clicked a new item, match the sort direction on all internal criteria items
        if (selectionChanged) {
          // All criteria items must use the same sort direction
          if (criteriaItems && criteriaItems.length) {
            // Use the first item to determine the general sort direction
            const firstItem = criteriaItems[0];
            // Don't set secondary icon for alternate sorting
            if (firstItem.sortDirection !== CriteriaSortDirection.Alternate) {
              // Remove all secondary icons
              model.items.forEach(i => i.secondaryIcon = null);
              // Set icon
              chipItem.secondaryIcon = firstItem.sortDirection === CriteriaSortDirection.Ascending ?
                AppActionIcons.SortAscending : AppActionIcons.SortDescending;
              // Make sure the sorting matches the icon          
              criteriaItems.forEach(i => i.sortDirection = firstItem.sortDirection);
            }
          }
          // The Ok action will be called automatically
        }
        // If the user clicked the same sort, swap the sorting direction
        else {
          if (criteriaItems && criteriaItems[0] && criteriaItems[0].sortDirection === CriteriaSortDirection.Alternate) {
            // Don't do anything if the user is clicking a selected alternate sorting
            return;
          }
          // A selected chip was clicked so swap the sort direction
          if (chipItem.secondaryIcon === AppActionIcons.SortAscending) {
            chipItem.secondaryIcon = AppActionIcons.SortDescending;
            criteriaItems.forEach(i => i.sortDirection = CriteriaSortDirection.Descending);
          }
          else {
            chipItem.secondaryIcon = AppActionIcons.SortAscending;
            criteriaItems.forEach(i => i.sortDirection = CriteriaSortDirection.Ascending);
          }
          // Fire only in this case since it will automatically close if the selection changed
          this.sidebarHostService.closeOk();
        }
      }
    };
    return result;
  }

  private addSortingChip(
    id: string,
    columns: string[],
    icon: string,
    caption: string,
    chips: IChipItem[],
    sortingCriteria: CriteriaItems,
    sortDirection?: CriteriaSortDirection
  ): IChipItem {
    const criteriaItems = new CriteriaItems();
    criteriaItems.id = id;
    for (const columnName of columns) {
      criteriaItems.addSorting(columnName, sortDirection ? sortDirection : CriteriaSortDirection.Ascending);
    }
    chips.push({
      sequence: chips.length + 1,
      icon: icon,
      caption: caption,
      value: criteriaItems,
      secondaryIcon: this.getSortingIcon(criteriaItems.id, sortingCriteria),
      selected: sortingCriteria.id === criteriaItems.id
    });
    return chips[chips.length - 1];
  }

  private addAlternateChip(
    id: string,
    columns: string[],
    icon: string,
    caption: string,
    chips: IChipItem[],
    sortingCriteria: CriteriaItems
  ): IChipItem {
    return this.addSortingChip(id, columns, icon, caption, chips, sortingCriteria, CriteriaSortDirection.Alternate);
  }

  public getSortingForSongs(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-artistName', ['primaryArtistName', 'primaryAlbumName', 'mediaNumber', 'trackNumber', 'name'],
      AppAttributeIcons.ArtistName, 'Artist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-albumName', ['primaryAlbumName', 'mediaNumber', 'trackNumber', 'name'],
      AppAttributeIcons.AlbumName, 'Album Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-releaseYear',
      ['releaseYear', 'primaryAlbumName', 'mediaNumber', 'trackNumber', 'name'],
      AppAttributeIcons.Year, 'Release Year', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playCount', ['playCount', 'releaseYear', 'name'],
      AppAttributeIcons.PlayCount, 'Play Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playDate', ['playDate'],
      AppAttributeIcons.PlayDate, 'Play Date', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-addDate', ['addDate', 'name'],
      AppAttributeIcons.AddDate, 'Add Date', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-rating', ['rating', 'playCount'],
      AppAttributeIcons.RatingOn, 'Rating', result, existingCriteria.sortingCriteria);
    this.addAlternateChip(
      'alternate-artist', ['primaryArtistName'],
      AppActionIcons.Alternate, 'Alternate Artists', result, existingCriteria.sortingCriteria);
    this.addAlternateChip(
      'alternate-language', ['language'],
      AppActionIcons.Alternate, 'Alternate Languages', result, existingCriteria.sortingCriteria);
    
    return result;
  }

  public getSortingForAlbumArtists(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-artistName', ['name'],
      AppAttributeIcons.ArtistName, 'Artist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playCount', ['playCount', 'name'],
      AppAttributeIcons.PlayCount, 'Play Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-addDate', ['songAddDateMax'],
      AppAttributeIcons.AddDate, 'Last Song Add Date', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForAlbums(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-albumName', ['name'],
      AppAttributeIcons.AlbumName, 'Album Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-playCount', ['playCount', 'releaseYear', 'name'],
      AppAttributeIcons.PlayCount, 'Play Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'releaseYear', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-addDate', ['songAddDateMax'],
      AppAttributeIcons.AddDate, 'Last Song Add Date', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-artistName', ['artistName', 'releaseYear', 'name'],
      AppAttributeIcons.ArtistName, 'Artist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-releaseYear', ['releaseYear', 'name'],
      AppAttributeIcons.Year, 'Release Year', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForClassifications(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-classificationName', ['name'],
      AppEntityIcons.Classification, 'Classification Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-classificationType', ['classificationType', 'name'],
      AppAttributeIcons.ClassificationType, 'Classification Type', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForPlaylists(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-playlistName', ['name'],
      AppEntityIcons.Playlist, 'Playlist Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-songCount', ['songCount', 'name'],
      AppAttributeIcons.SongCount, 'Song Count', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-changeDate', ['changeDate'],
      AppAttributeIcons.ChangeDate, 'Change Date', result, existingCriteria.sortingCriteria);    
    return result;
  }

  public getSortingForFilters(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addSortingChip(
      'sorting-filterName', ['name'],
      AppEntityIcons.Smartlist, 'Name', result, existingCriteria.sortingCriteria);
    this.addSortingChip(
      'sorting-favorite', ['favorite', 'accessDate', 'name'],
      AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.sortingCriteria, CriteriaSortDirection.Descending);
    this.addSortingChip(
      'sorting-accessDate', ['accessDate'],
      AppAttributeIcons.AccessDate, 'Access Date', result, existingCriteria.sortingCriteria, CriteriaSortDirection.Descending);
    return result;
  }

  private getSortingIcon(id: string, criteriaItems: CriteriaItems): string {
    if (criteriaItems.id === id) {
      const firstItem = criteriaItems[0];
      if (firstItem.sortDirection === CriteriaSortDirection.Ascending) {
        return AppActionIcons.SortAscending;
      }
      return AppActionIcons.SortDescending;
    }
    return null;
  }
}
