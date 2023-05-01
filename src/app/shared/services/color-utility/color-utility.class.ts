import { ColorG, IColorBucket } from "src/app/core/models/color-g.class";
import { ColorBucketGroup, ColorServiceName, IFullColorPalette } from "./color-utility.interface";

export class BucketPalette {
  private buckets: IColorBucket[];
  constructor(colors: ColorG[]) {
    this.initialize(colors);
  }

  public get dominant(): IColorBucket {
    return this.findBucket(ColorBucketGroup.Dominant);
  }

  public get background(): IColorBucket {
    return this.findBucket(ColorBucketGroup.Background);
  }

  public get primary(): IColorBucket {
    return this.findBucket(ColorBucketGroup.Primary);
  }

  public get secondary(): IColorBucket {
    return this.findBucket(ColorBucketGroup.Secondary);
  }

  public selectBucketColor(selectedColor: ColorG, groupName: string): void {
    const currentBucket = this.findBucket(groupName);
    const currentColor = currentBucket.selected;

    // Do nothing, same color already selected
    if (currentColor.hex === selectedColor.hex) {
      return;
    }

    // Color in the same bucket, just change the selection
    if (selectedColor.hueCaption === currentBucket.hueCaption) {
      currentBucket.selected = selectedColor;
      return;
    }

    // If we get this far, the color is on a different bucket, so find it
    let newBucket: IColorBucket;
    this.buckets.forEach(bucket => {
      // is the color in this bucket?
      if (!newBucket && bucket.hueCaption === selectedColor.hueCaption) {
        newBucket = bucket;
      }
    });
    // Select color
    newBucket.selected = selectedColor;

    // Swap buckets between palettes so they don't all end up with the same color
    const newBucketGroups = newBucket.groups;
    newBucket.groups = currentBucket.groups;
    currentBucket.groups = newBucketGroups;
  }

  public toFullPalette(): IFullColorPalette {
    const result: IFullColorPalette = {
      background: this.background.selected,
      primary: this.primary.selected,
      secondary: this.secondary.selected,
      dominant: this.dominant.selected,
      colors: [],
      serviceName: ColorServiceName.Default
    };
    return result;
  }

  private initialize(colors: ColorG[]): void {
    // Get background color
    const backgroundColor = colors[0];
    // Setup contrast color
    colors.forEach(color => {
      // Background color will end up with the same contrast color which will cause a contrast of 1 (the lowest contrast value).
      color.contrastColor = backgroundColor.rgba;
    });
    // Get a list of colors without the background
    const colorList = colors.slice(1);
    // Group by hue
    this.buckets = this.gatherSameHueColors(colorList);
    // Look for the background and dominant buckets
    let backgroundBucketFound = false;
    let dominantBucketFound = false;
    this.buckets.forEach(bucket => {
      // Find bg bucket
      if (!backgroundBucketFound && bucket.hueCaption === backgroundColor.closest.hueCaption) {
        // Put it at the top
        bucket.colors.unshift(backgroundColor);
        bucket.groups.push(ColorBucketGroup.Background);
        backgroundBucketFound = true;
      }
      // Find dominant bucket
      if (!dominantBucketFound) {
        bucket.groups.push(ColorBucketGroup.Dominant);
        dominantBucketFound = true;
      }
      else {
        const currentDominantBucket = this.findBucket(ColorBucketGroup.Dominant);
        // Replace dominant bucket
        if (currentDominantBucket.dominance < bucket.dominance) {
          // Remove group from old bucket
          currentDominantBucket.groups.splice(currentDominantBucket.groups.indexOf(ColorBucketGroup.Dominant), 1);
          // Add to new bucket
          bucket.groups.push(ColorBucketGroup.Dominant);
        }
      }
    });
    // Add a new bucket if we didn't find one for this color
    if (!backgroundBucketFound) {
      const newColorBucket: IColorBucket = {
        hueCaption: backgroundColor.closest.hueCaption,
        colors: [ backgroundColor ],
        dominance: backgroundColor.dominance,
        groups: [ColorBucketGroup.Background]
      };
      this.buckets.push(newColorBucket);
      const currentDominantBucket = this.findBucket(ColorBucketGroup.Dominant);
      if (currentDominantBucket.dominance < newColorBucket.dominance) {
        // Remove group from old bucket
        currentDominantBucket.groups.splice(currentDominantBucket.groups.indexOf(ColorBucketGroup.Dominant), 1);
        // Add to new bucket
        newColorBucket.groups.push(ColorBucketGroup.Dominant);
      }
    }
    // Sort buckets by contrast using first color of each bucket
    this.buckets = this.buckets.sort((a, b) => {
      const firstColorA = a.colors[0];
      const firstColorB = b.colors[0];

      if (firstColorA.contrast > firstColorB.contrast) {
        return -1;
      }
      if (firstColorA.contrast < firstColorB.contrast) {
        return 1;
      }
      return 0;
    });
    // Set default selected colors
    const backgroundBucket = this.findBucket(ColorBucketGroup.Background);
    backgroundBucket.selected = backgroundColor;
    this.buckets.forEach(bucket => {
      if (!bucket.selected) {
        bucket.selected = bucket.colors[0];
      }
    });
    // Set primary and secondary buckets; we should have at least two buckets
    const alternateBuckets = this.buckets.filter(bucket => !bucket.groups.includes(ColorBucketGroup.Background));
    alternateBuckets[0].groups.push(ColorBucketGroup.Primary);
    if (alternateBuckets.length === 1) {
      alternateBuckets[0].groups.push(ColorBucketGroup.Secondary);
    }
    else {
      alternateBuckets[1].groups.push(ColorBucketGroup.Secondary);
    }
  }

  /**
   * Groups colors by hue; each bucket represents a group.
   * @param colorList List of colors.
   * @returns A list of color buckets.
   */
  private gatherSameHueColors(colorList: ColorG[]): IColorBucket[] {
    const buckets = ColorG.group(colorList, (colorA, colorB) => colorA.closest.hueHex === colorB.closest.hueHex);
    buckets.forEach(bucket => {
      const firstColor = bucket.colors[0];
      bucket.selected = firstColor;
      bucket.hueCaption = firstColor.hueCaption;
    });
    return buckets;
  }

  private findBucket(groupName: string): IColorBucket {
    return this.buckets.find(bucket => bucket.groups.includes(groupName));
  }
}