import { Directive, OnDestroy } from '@angular/core';

@Directive({
  selector: '[spIntersectionObserver]'
})
export class IntersectionObserverDirective implements OnDestroy {

  private mapping: Map<Element, (isIntersecting: boolean) => void>;
  private observer: IntersectionObserver;

  constructor() {
    this.mapping = new Map<Element, () => void>();

    this.observer = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        const callback = this.mapping.get(entry.target);
        if (callback) {
          callback(entry.isIntersecting);
        }
      }
    });
  }

  public ngOnDestroy(): void {
    this.mapping.clear();
    this.observer.disconnect();
  }

  public add(element: Element, callback: (isIntersecting: boolean) => void): void {
    this.mapping.set(element, callback);
    this.observer.observe(element);
  }

  public remove(element: Element): void {
    this.mapping.delete(element);
    this.observer.unobserve(element);
  }
}
