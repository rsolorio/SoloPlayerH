import { DeviceType, AppType } from "./feature-detection.enum";

export interface IFeatureInfo {
  isMobileBrowser: boolean;
  platform: IFeaturePlatform;
  deviceType: DeviceType;
}

export interface IFeaturePlatform {
  app: AppType;
  os: string;
  browser: IFeatureBrowser;
}

export interface IFeatureBrowser {
  name: string;
  fullVersion: string;
  majorVersion: number;
  appName: string;
  userAgent: string;
}