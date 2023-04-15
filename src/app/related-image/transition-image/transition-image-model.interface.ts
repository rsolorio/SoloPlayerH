import { IImage } from "src/app/core/models/core.interface";

export interface ITransitionImageModel extends IImage {
  /** The src of the default image that is displayed before transitioning to the actual image. */
  defaultSrc: string;
  /** An optional method to retrieve the actual image. */
  getImage?: () => Promise<IImage>;
}