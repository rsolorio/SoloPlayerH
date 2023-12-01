import { Injectable } from '@angular/core';
import { CriteriaComparison, CriteriaJoinOperator } from '../criteria/criteria.enum';
import { ChipDisplayMode, ChipSelectorType, IChipItem, IChipSelectionModel } from '../../components/chip-selection/chip-selection-model.interface';
import { Criteria, CriteriaItem, CriteriaItems } from '../criteria/criteria.class';
import { AppActionIcons, AppAttributeIcons, AppEntityIcons } from 'src/app/app-icons';
import { ModuleOptionId } from './database.seed';
import { DatabaseOptionsService } from './database-options.service';
import { ValueLists } from './database.lists';
import { ChipSelectionComponent } from '../../components/chip-selection/chip-selection.component';
import { SideBarHostStateService } from 'src/app/core/components/side-bar-host/side-bar-host-state.service';
import { ValueListEntryEntity } from '../../entities';
import { UtilityService } from 'src/app/core/services/utility/utility.service';

@Injectable({
  providedIn: 'root'
})
export class DatabaseFiltersService {

  constructor(private options: DatabaseOptionsService, private sidebarHostService: SideBarHostStateService, private utilities: UtilityService) { }

  public getQuickFilterPanelModel(chips: IChipItem[], subTitle: string, subTitleIcon: string): IChipSelectionModel {
    const multipleEnabled = this.options.getBoolean(ModuleOptionId.AllowMultipleQuickFilters);
    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Quick Filters',
      titleIcon: AppActionIcons.Filter,
      subTitle: subTitle,
      subTitleIcon: subTitleIcon,
      displayMode: ChipDisplayMode.Block,
      type: multipleEnabled ? ChipSelectorType.MultipleOk : ChipSelectorType.Quick,
      okDelay: multipleEnabled ? 0 : 300,
      items: chips,
      okHidden: !multipleEnabled,
      actions: [{
        caption: 'Clear',
        action: (iconAction, result) => {
          const model = result as IChipSelectionModel;
          model.items.forEach(v => v.selected = false);
          if (!multipleEnabled) {
            this.sidebarHostService.closeOk();
          }
        }
      }]
    };
    return result;
  }

  private addQuickFilterChip(
    id: string,
    columnName: string,
    columnValue: any,
    comparison: CriteriaComparison,
    icon: string,
    caption: string,
    chips: IChipItem[],
    criteriaItems: CriteriaItems): void
  {
    const criteriaItem = new CriteriaItem(columnName, columnValue);
    criteriaItem.id = id;
    criteriaItem.comparison = comparison;
    criteriaItem.expressionOperator = CriteriaJoinOperator.Or;
    chips.push({
      sequence: chips.length + 1,
      icon: icon,
      caption: caption,
      value: criteriaItem,
      selected: !!criteriaItems.find(c => c.id === id)
    });
  }

  public getQuickFiltersForSongs(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-favorite', 'favorite', true, CriteriaComparison.Equals, AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-playCount', 'playCount', 0, CriteriaComparison.Equals, AppAttributeIcons.PlayCount, 'Not Played', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-lyrics', 'lyrics', undefined, CriteriaComparison.IsNotNull, AppAttributeIcons.LyricsOn, 'Has Lyrics', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-ratingTop', 'rating', 5, CriteriaComparison.Equals, AppAttributeIcons.RatingOn, 'Top Rated', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-ratingHigh', 'rating', 4, CriteriaComparison.GreaterThanOrEqualTo, AppAttributeIcons.RatingHalf, 'High Rated', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-live', 'live', true, CriteriaComparison.Equals, AppAttributeIcons.LiveOn, 'Live', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-explicit', 'explicit', true, CriteriaComparison.Equals, AppAttributeIcons.ExplicitOn, 'Explicit', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-performerCount', 'performerCount', 1, CriteriaComparison.GreaterThan, AppAttributeIcons.PerformerCount, 'Multi Artist', result, existingCriteria.quickCriteria);
    return result;
  }

  public getQuickFiltersForArtists(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-favorite', 'favorite', true, CriteriaComparison.Equals, AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-playCount', 'playCount', 0, CriteriaComparison.Equals, AppAttributeIcons.PlayCount, 'Not Played', result, existingCriteria.quickCriteria);
    const longPlaySongCount = this.options.getNumber(ModuleOptionId.LongPlayArtistThreshold);
    this.addQuickFilterChip('quickFilter-songCount', 'songCount', longPlaySongCount, CriteriaComparison.GreaterThanOrEqualTo, AppAttributeIcons.LongPlay, 'Long Play', result, existingCriteria.quickCriteria);
    return result;
  }

  public getQuickFiltersForAlbums(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-favorite', 'favorite', true, CriteriaComparison.Equals, AppAttributeIcons.FavoriteOn, 'Favorite', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-playCount', 'playCount', 0, CriteriaComparison.Equals, AppAttributeIcons.PlayCount, 'Not Played', result, existingCriteria.quickCriteria);
    const longPlaySongCount = this.options.getNumber(ModuleOptionId.LongPlayAlbumThreshold);
    this.addQuickFilterChip('quickFilter-songCount', 'songCount', longPlaySongCount, CriteriaComparison.GreaterThanOrEqualTo, AppAttributeIcons.LongPlay, 'Long Play', result, existingCriteria.quickCriteria);
    return result;
  }

  public getQuickFiltersForClassifications(existingCriteria: Criteria): IChipItem[] {
    const result: IChipItem[] = [];
    this.addQuickFilterChip('quickFilter-genre', 'classificationTypeId', ValueLists.Genre.id, CriteriaComparison.Equals, AppEntityIcons.Genre, 'Genres', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-subgenre', 'classificationTypeId', ValueLists.Subgenre.id, CriteriaComparison.Equals, AppEntityIcons.Subgenre, 'Subgenres', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-occasion', 'classificationTypeId', ValueLists.Occasion.id, CriteriaComparison.Equals, AppEntityIcons.Occasion, 'Occasions', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-instrument', 'classificationTypeId', ValueLists.Instrument.id, CriteriaComparison.Equals, AppEntityIcons.Instrument, 'Instruments', result, existingCriteria.quickCriteria);
    this.addQuickFilterChip('quickFilter-category', 'classificationTypeId', ValueLists.Category.id, CriteriaComparison.Equals, AppEntityIcons.Category, 'Categories', result, existingCriteria.quickCriteria);
    return result;
  }

  public async getValueListSelectorModel(valueListTypeId: string, sortByName: boolean, isSelected: (chip: IChipItem) => boolean): Promise<IChipSelectionModel> {
    let entries = await ValueListEntryEntity.findBy({ valueListTypeId: valueListTypeId });
    if (sortByName) {
      entries = this.utilities.sort(entries, 'name');
    }
    else {
      entries = this.utilities.sort(entries, 'sequence');
    }

    const chips = entries.map(entry => {
      const chip: IChipItem = {
        value: entry.id,
        caption: entry.name
      };
      chip.selected = isSelected(chip);
      return chip;
    });

    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Filter By',
      titleIcon: AppActionIcons.Filter,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Multiple,
      items: chips
    };
    return result;
  }

  public async getSongValuesSelectorModel(values: IChipItem[], isSelected: (chip: IChipItem) => boolean): Promise<IChipSelectionModel> {
    //let values = await this.getSongValues(columnName);
    values.forEach(v => v.selected = isSelected(v));
    const result: IChipSelectionModel = {
      componentType: ChipSelectionComponent,
      title: 'Filter By',
      titleIcon: AppActionIcons.Filter,
      displayMode: ChipDisplayMode.Block,
      type: ChipSelectorType.Multiple,
      items: values
    };
    return result;
  }
}
