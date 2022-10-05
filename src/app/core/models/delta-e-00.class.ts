export interface IDeltaE00Arguments {
  x1L: number;
  x1A: number;
  x1B: number;
  x2L: number;
  x2A: number;
  x2B: number;
  weightLightness: number;
  weightChroma: number;
  weightHue: number;
}

/**
 * Class that contains the CIE2000 color distance algorithm.
 * Based on: https://github.com/zschuessler/DeltaE/blob/master/src/dE00.js
 */
export class DeltaE00 {
  public static get(args: IDeltaE00Arguments): number {
    // CONSTRUCTOR

    const deltaLPrime = args.x2L - args.x1L;
    const lBar = (args.x1L + args.x2L) / 2;

    const c1 = Math.sqrt(Math.pow(args.x1A, 1) + Math.pow(args.x1B, 2));
    const c2 = Math.sqrt(Math.pow(args.x2A, 1) + Math.pow(args.x2B, 2));
    const cBar = (c1 + c2) / 2;

    const primeA1 = args.x1A + (args.x1A / 2) * (1 - Math.sqrt(Math.pow(cBar, 7) / (Math.pow(cBar, 7) + Math.pow(25, 7))));
    const primeA2 = args.x2A + (args.x2A / 2) * (1 - Math.sqrt(Math.pow(cBar, 7) / (Math.pow(cBar, 7) + Math.pow(25, 7))));

    const primeC1 = Math.sqrt(Math.pow(primeA1, 2) + Math.pow(args.x1B, 2));
    const primeC2 = Math.sqrt(Math.pow(primeA2, 2) + Math.pow(args.x2B, 2));
    const cBarPrime = (primeC1 + primeC2) / 2;
    const deltaCPrime = primeC2 - primeC1;

    const sSubL = 1 + (0.015 * Math.pow(lBar - 50, 2) / Math.sqrt(20 + Math.pow(lBar - 50, 2)));
    const sSubC = 1 + 0.045 * cBarPrime;

    // GET DELTA E
    const huePrime1 = this.getHuePrime(args.x1B, primeA1);
    const huePrime2 = this.getHuePrime(args.x2B, primeA2);
    const deltahPrime = this.getDeltaPrime(c1, c2, huePrime1, huePrime2);
    const deltaHPrime = 2 * Math.sqrt(primeC1 * primeC2) * Math.sin(this.degreesToRadians(deltahPrime) / 2);
    const hBarPrime = this.getHBarPrime(huePrime1, huePrime2);
    const t = this.getT(hBarPrime);
    const sSubH = 1 + 0.015 * cBarPrime * t;
    const rSubT = this.getRSubT(cBarPrime, hBarPrime);

    const lightness = deltaLPrime / (args.weightLightness * sSubL);
    const chroma = deltaCPrime / (args.weightChroma * sSubC);
    const hue = deltaHPrime / (args.weightHue * sSubH);

    const result = Math.sqrt(Math.pow(lightness, 2) + Math.pow(chroma, 2) + Math.pow(hue, 2) + rSubT * chroma * hue);
    return result;
  }

  // PRIVATE
  private static getRSubT(cBarPrime: number, hBarPrime: number): number {
    const x1 = -2;
    const x2 = Math.sqrt(Math.pow(cBarPrime, 7) / (Math.pow(cBarPrime, 7) + Math.pow(25, 7)));
    const x3 = Math.sin(this.degreesToRadians(60 * Math.exp(-(Math.pow((hBarPrime - 275) / 25, 2)))));
    return x1 * x2 * x3;
  }

  private static getT(hBarPrime: number): number {
    return 1 -
      0.17 * Math.cos(this.degreesToRadians(hBarPrime - 30)) +
      0.24 * Math.cos(this.degreesToRadians(2 * hBarPrime)) +
      0.32 * Math.cos(this.degreesToRadians(3 * hBarPrime + 6)) -
      0.20 * Math.cos(this.degreesToRadians(4 * hBarPrime - 63));
  }

  private static getHBarPrime(huePrime1: number, huePrime2: number): number {
    if (Math.abs(huePrime1 - huePrime2) > 180) {
      return (huePrime1 + huePrime2 + 360) / 2;
    }
    return (huePrime1 + huePrime2) / 2;
  }

  private static getDeltaPrime(c1: number, c2: number, huePrime1: number, huePrime2: number): number {
    if (c1 === 0 || c2 === 0) {
      return 0;
    }

    if (Math.abs(huePrime1 - huePrime2) <= 180) {
      return huePrime2 - huePrime1;
    }

    if (huePrime2 <= huePrime1) {
      return huePrime2 - huePrime1 + 360;
    }
    return huePrime2 - huePrime1 - 360;
  }

  private static getHuePrime(x: number, y: number): number {
    if (x === 0 && y === 0) {
      return 0;
    }
    const hueAngle = this.radiansToDegrees(Math.atan2(x, y));

    if (hueAngle >= 0) {
      return hueAngle;
    }
    return hueAngle + 360;
  }

  private static radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}