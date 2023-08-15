import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CoreComponent } from 'src/app/core/models/core-component.class';
import { CoreEvent } from 'src/app/core/services/events/events.enum';
import { EventsService } from 'src/app/core/services/events/events.service';
import { BreadcrumbDisplayMode, BreadcrumbEventType } from '../../models/breadcrumbs.enum';
import { AppEvent } from '../../models/events.enum';
import { IBreadcrumbModel, IBreadcrumbsModel } from './breadcrumbs-model.interface';
import { BreadcrumbsStateService } from './breadcrumbs-state.service';

@Component({
  selector: 'sp-breadcrumbs',
  templateUrl: './breadcrumbs.component.html',
  styleUrls: ['./breadcrumbs.component.scss']
})
export class BreadcrumbsComponent extends CoreComponent implements OnInit {
  @ViewChild('breadcrumbsContainer') private breadcrumbsContainer: ElementRef;
  public BreadcrumbDisplayMode = BreadcrumbDisplayMode;
  public model: IBreadcrumbsModel;
  public leftScrollIndicatorVisible = false;
  public rightScrollIndicatorVisible = false;
  public containerClass = 'sp-bc-icon-null';

  get iconVisible(): boolean {
    return this.model.displayMode === BreadcrumbDisplayMode.All || this.model.displayMode === BreadcrumbDisplayMode.Icon;
  }

  get captionVisible(): boolean {
    return this.model.displayMode === BreadcrumbDisplayMode.All || this.model.displayMode === BreadcrumbDisplayMode.Caption;
  }

  get breadcrumbsVisible(): boolean {
    return this.model.displayMode !== BreadcrumbDisplayMode.None;
  }

  constructor(private breadcrumbService: BreadcrumbsStateService, private events: EventsService) {
    super();
  }

  ngOnInit(): void {
    this.reload();
    this.subs.sink = this.events.onEvent<BreadcrumbEventType>(AppEvent.BreadcrumbUpdated).subscribe(response => {
      if (response === BreadcrumbEventType.ReloadRequested) {
        this.reload();
      }
    });

    this.subs.sink = this.events.onEvent(CoreEvent.WindowSizeChanged).subscribe(() => {
      this.updateScrollIndicators();
    });

    // Give time to render content
    setTimeout(() => {
      this.updateScrollIndicators();
    });
  }

  public onClick(breadcrumb: IBreadcrumbModel): void {
    if (breadcrumb.last) {
      // If it's the last remove it
      this.breadcrumbService.remove(breadcrumb.sequence);
    }
    else {
      // If it's not the last, leave it and remove trailing ones
      this.breadcrumbService.remove(breadcrumb.sequence + 1);
    }
  }

  /** Refreshes the component with the latest version of the model. */
  public reload(): void {
    this.model = this.breadcrumbService.getState();
  }

  public onContainerScroll(): void {
    this.updateScrollIndicators();
  }

  public scrollLeft(value: number): void {
    let position = this.breadcrumbsContainer.nativeElement.scrollLeft as number;
    // Can be scrolled?
    if (position > 0) {
      position -= value;
      // Do not go below zero
      if (position >= 0) {
        this.breadcrumbsContainer.nativeElement.scrollLeft = position;
      }
      else {
        this.breadcrumbsContainer.nativeElement.scrollLeft = 0;
      }
    }
  }

  public scrollToLeft(): void {
    this.breadcrumbsContainer.nativeElement.scrollLeft = 0;
  }

  public scrollRight(value: number): void {
    let position = this.breadcrumbsContainer.nativeElement.scrollLeft as number;
    const width = this.breadcrumbsContainer.nativeElement.scrollWidth as number;
    // Can be scrolled?
    if (position < width) {
      position += value;
      // Do not go beyond the available width
      if (position <= width) {
        this.breadcrumbsContainer.nativeElement.scrollLeft = position;
      }
      else {
        this.breadcrumbsContainer.nativeElement.scrollLeft = width;
      }
    }
  }

  public scrollToRight(): void {
    this.breadcrumbsContainer.nativeElement.scrollLeft = this.breadcrumbsContainer.nativeElement.scrollWidth;
  }

  private updateScrollIndicators(): void {
    if (this.breadcrumbsContainer && this.breadcrumbsContainer.nativeElement) {
      const scrollArea = this.breadcrumbsContainer.nativeElement;
      this.leftScrollIndicatorVisible = scrollArea.scrollLeft > 0;
      this.rightScrollIndicatorVisible =
        scrollArea.scrollWidth > scrollArea.offsetWidth && (scrollArea.scrollLeft + scrollArea.offsetWidth) < scrollArea.scrollWidth;
    }
    if (this.leftScrollIndicatorVisible) {
      if (this.rightScrollIndicatorVisible) {
        this.containerClass = 'sp-bc-icon-both';
      }
      else {
        this.containerClass = 'sp-bc-icon-left';
      }
    }
    else if (this.rightScrollIndicatorVisible) {
      this.containerClass = 'sp-bc-icon-right';
    }
    else {
      this.containerClass = 'sp-bc-icon-null';
    }
  }

  public onContainerWheel(wheelEvent: any): void {
    if (wheelEvent.type === 'wheel') {
      if (wheelEvent.deltaY < 0) {
        // Scrolling up, moving left
        this.scrollLeft(10);
      }
      else if (wheelEvent.deltaY > 0) {
        // Scrolling down, moving right
        this.scrollRight(10);
      }
    }
  }

  public onScrollLeftClick(): void {
    this.scrollToLeft();
  }

  public onScrollRightClick(): void {
    this.scrollToRight();
  }
}
