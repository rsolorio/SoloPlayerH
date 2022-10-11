import { Directive, ElementRef, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { IntersectionObserverDirective } from './intersection-observer.directive';

@Directive({
  selector: '[spIntersectionObserverTarget]'
})
export class IntersectionObserverTargetDirective implements OnInit, OnDestroy {

  @Output() public intersectionChange: EventEmitter<boolean> = new EventEmitter();
  public isIntersecting = false;
  private parentObserver: IntersectionObserverDirective;
  private elementRef: ElementRef;
  constructor(parent: IntersectionObserverDirective, elementReference: ElementRef) {
    this.parentObserver = parent;
    this.elementRef = elementReference;
  }

  public ngOnDestroy(): void {
    if (this.parentObserver) {
      this.parentObserver.remove(this.elementRef.nativeElement);
    }
  }

  public ngOnInit(): void {
    if (this.parentObserver) {
      this.parentObserver.add(this.elementRef.nativeElement, isIntersecting => {
        this.isIntersecting = isIntersecting;
        this.intersectionChange.emit(this.isIntersecting);
      });
    }
  }

}
