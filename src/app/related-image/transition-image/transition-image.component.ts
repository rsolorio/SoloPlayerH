import { Component, Input, ChangeDetectionStrategy, OnInit, ChangeDetectorRef } from '@angular/core';
import { ITransitionImageModel } from './transition-image-model.interface';
import { PromiseQueueService } from 'src/app/core/services/promise-queue/promise-queue.service';

@Component({
  selector: 'sp-transition-image',
  templateUrl: './transition-image.component.html',
  styleUrls: ['./transition-image.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TransitionImageComponent implements OnInit {
  /** Flag that tells when the actual image has been loaded. */
  public transitionImageLoaded = false;
  /** Flag that tells if the default image should be rendered. */
  public defaultImageEnabled = true;

  @Input() public model: ITransitionImageModel = {
    defaultSrc: null,
    src: null,
    srcType: null
  };

  constructor(private queueService: PromiseQueueService, private cd: ChangeDetectorRef) {}

  public ngOnInit(): void {
    if (!this.model.src && this.model.getImage) {
      this.queueService.sink = () => this.setImage();
    }
  }

  public onTransitionImageLoad(e: Event): void {
    this.transitionImageLoaded = true;
    // TODO: turn off the default image so it is unloaded from the DOM
    // the problem is that we will need to wait a little bit for the transition animation to finish
    // which means that we need to a timeout and then we will need to force a change detection
  }

  private async setImage(): Promise<void> {
    const image = await this.model.getImage();
    if (image) {
      this.model.src = image.src;
      this.model.srcType = image.srcType;
      this.cd.detectChanges();
    }
  }
}
