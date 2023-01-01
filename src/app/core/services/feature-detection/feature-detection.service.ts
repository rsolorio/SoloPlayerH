import { Injectable } from '@angular/core';
import { AppType, DeviceType } from './feature-detection.enum';
import { IFeatureInfo, IFeaturePlatform } from './feature-detection.interface';

@Injectable({
  providedIn: 'root'
})
export class FeatureDetectionService {
  private initialized = false;
  private feature: IFeatureInfo = {
    isMobileBrowser: false,
    platform: {
      app: AppType.Unknown,
      os: null,
      browser: {
        name: null,
        fullVersion: null,
        majorVersion: null,
        appName: null,
        userAgent: null
      }
    },
    deviceType: DeviceType.Unknown
  };
  
  constructor() {
  }

  public get(): IFeatureInfo {
    if (!this.initialized) {
      this.initialize();
    }
    return this.feature;
  }

  public initialize(): IFeatureInfo {
    if (this.initialized) {
      return this.feature;
    }
    const agent = navigator.userAgent;

    if ('cordova' in window) {
      this.feature.platform.app = AppType.Cordova;
    }
    else if (agent.indexOf('Electron') > -1) {
      this.feature.platform.app = AppType.Electron;
    }
    else {
      this.setWebInfo(this.feature.platform);
      this.feature.isMobileBrowser = this.browserIsMobile();
    }
    this.setDeviceType(this.feature);
    this.initialized = true;
    return this.feature;
  }

  public isElectron(): boolean {
    return this.feature.platform.app === AppType.Electron;
  }

  public isCordova(): boolean {
    return this.feature.platform.app === AppType.Cordova;
  }

  public isPhone(): boolean {
    return this.feature.deviceType === DeviceType.Phone;
  }

  /**
   * Determines if the browser running the app is from a mobile device.
   */
  private browserIsMobile(): boolean {
    // Code from: http://detectmobilebrowsers.com
    const vendors: RegExp = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i;
    const agents: RegExp = /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i;

    const data = navigator.userAgent || navigator.vendor || (window as any).opera as string;
    return vendors.test(data) || agents.test(data.substr(0, 4));
  }

  private setWebInfo(platform: IFeaturePlatform): void {
    const userAgent = navigator.userAgent;
    const appVersion = navigator.appVersion;
    let browserName = navigator.appName;
    let fullVersion = '' + parseFloat(appVersion);
    let majorVersion = parseInt(appVersion, 10);
    let nameIndex = -1;
    let versionIndex = -1;
    let separatorIndex = -1;

    if ((versionIndex = userAgent.indexOf('Opera')) !== -1) {
      browserName = 'Opera';
      fullVersion = userAgent.substring(versionIndex + 6);
      if ((versionIndex = userAgent.indexOf('Version')) !== -1) {
        fullVersion = userAgent.substring(versionIndex + 8);
      }
    }  else if ((versionIndex = userAgent.indexOf('OPR/')) !== -1) {
      //The newer versions of Opera have OPR
      browserName = 'Opera';
      fullVersion = userAgent.substring(versionIndex + 4);
      if ((versionIndex = userAgent.indexOf('Version')) !== -1) {
        fullVersion = userAgent.substring(versionIndex + 8);
      }
    } else if ((versionIndex = userAgent.indexOf('MSIE')) !== -1) {
      // In MSIE, the true version is after 'MSIE' in userAgent
      browserName = 'Microsoft Internet Explorer';
      fullVersion = userAgent.substring(versionIndex + 5);
    } else if ((versionIndex = userAgent.indexOf('Chrome')) !== -1) {
      // In Chrome, the true version is after 'Chrome'
      browserName = 'Chrome';
      fullVersion = userAgent.substring(versionIndex + 7);
    } else if ((versionIndex = userAgent.indexOf('Safari')) !== -1) {
      // In Safari, the true version is after 'Safari' or after 'Version'
      browserName = 'Safari';
      fullVersion = userAgent.substring(versionIndex + 7);
      if ((versionIndex = userAgent.indexOf('Version')) !== -1) {
        fullVersion = userAgent.substring(versionIndex + 8);
      }
    } else if ((versionIndex = userAgent.indexOf('Firefox')) !== -1) {
      // In Firefox, the true version is after 'Firefox'
      browserName = 'Firefox';
      fullVersion = userAgent.substring(versionIndex + 8);
    } else if ((versionIndex = userAgent.lastIndexOf(' ') + 1) < (versionIndex = userAgent.lastIndexOf('/'))) {
      // In most other browsers, 'name/version' is at the end of userAgent
      browserName = userAgent.substring(nameIndex, versionIndex);
      fullVersion = userAgent.substring(versionIndex + 1);
      if (browserName.toLowerCase() === browserName.toUpperCase()) {
        browserName = navigator.appName;
      }
    }

    if ((separatorIndex = fullVersion.indexOf(';')) !== -1) {
      // trim the fullVersion string at semicolon/space if present
      fullVersion = fullVersion.substring(0, separatorIndex);
    }
    if ((separatorIndex = fullVersion.indexOf(' ')) !== -1) {
      fullVersion = fullVersion.substring(0, separatorIndex);
    }
    majorVersion = parseInt('' + fullVersion, 10);
    if (isNaN(majorVersion)) {
      fullVersion = '' + parseFloat(appVersion);
      majorVersion = parseInt(appVersion, 10);
    }

    let os = 'Unknown OS';
    if (appVersion.indexOf('Win') !== -1) {
      os = 'Windows';
    }
    if (appVersion.indexOf('Mac') !== -1) {
      os = 'MacOS';
    }
    if (appVersion.indexOf('X11') !== -1) {
      os = 'UNIX';
    }
    if (appVersion.indexOf('Linux') !== -1) {
      os = 'Linux';
    }

    platform.app = AppType.Web;
    platform.os = os;
    platform.browser.name = browserName;
    platform.browser.fullVersion = fullVersion;
    platform.browser.majorVersion = majorVersion;
    platform.browser.appName = navigator.appName;
    platform.browser.userAgent = userAgent;
  }

  private setDeviceType(feature: IFeatureInfo): void {
    const userAgent = navigator.userAgent.toLocaleLowerCase();
    const tablets = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk|(puffin(?!.*(IP|AP|WP))))/;
    if (tablets.test(userAgent)) {
      feature.deviceType = DeviceType.Tablet;
    }
    else if (feature.isMobileBrowser || feature.platform.app === AppType.Cordova) {
      feature.deviceType = DeviceType.Phone;
    }
    else {
      feature.deviceType = DeviceType.Desktop;
    }
  }
}
