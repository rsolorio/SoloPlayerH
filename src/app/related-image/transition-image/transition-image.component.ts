import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ITransitionImageModel } from './transition-image-model.interface';

@Component({
  selector: 'sp-transition-image',
  templateUrl: './transition-image.component.html',
  styleUrls: ['./transition-image.component.scss']
})
export class TransitionImageComponent {

  @Output() public imageLoaded: EventEmitter<void> = new EventEmitter();

  public model: ITransitionImageModel = {
    defaultImageSrc: null,
    transitionImageSrc: null,
    transitionImageLoaded: false
  };

  get defaultSrc(): string {
    return this.model.defaultImageSrc;
  }

  @Input() set defaultSrc(val: string) {
    this.model.defaultImageSrc = val;
  }

  get transitionSrc(): string {
    return this.model.transitionImageSrc;
  }

  @Input() set transitionSrc(val: string) {
    this.model.transitionImageSrc = val;
  }

  public onTransitionImageLoad(e: Event): void {
    this.model.transitionImageLoaded = true;
    this.imageLoaded.emit();
  }
}
