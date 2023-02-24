import { Directive, ElementRef, EventEmitter, OnDestroy, Output } from '@angular/core';
import { ISize } from 'src/app/core/models/core.interface';

@Directive({
  selector: '[spResizeObserver]'
})
export class ResizeObserverDirective implements OnDestroy {
  // @ts-ignore
  private parentResizeObserver: ResizeObserver;
  @Output() public spResized: EventEmitter<ISize> = new EventEmitter();

  constructor(private elementRef: ElementRef) {
    this.subscribeToResize();
  }

  public ngOnDestroy() {
    this.unsubscribeToResize();
  }

  private subscribeToResize() {
    if (this.parentResizeObserver) {
      return;
    }
    // Hack that prevents the typescript error not finding the observer constructor
    this.parentResizeObserver = new (window as any).ResizeObserver(entries => {
      const mainEntry = entries[0];
      if (mainEntry && mainEntry.contentRect) {
        const size: ISize = {
          height: mainEntry.contentRect.height,
          width: mainEntry.contentRect.width
        };
        this.spResized.emit(size);
      }
    });
    this.parentResizeObserver.observe(this.elementRef.nativeElement);
  }

  private unsubscribeToResize() {
    if (this.parentResizeObserver) {
      this.parentResizeObserver.unobserve(this.elementRef.nativeElement);
      this.parentResizeObserver = null;
    }
  }
}
