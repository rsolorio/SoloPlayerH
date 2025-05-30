/**
 * A list of exports available for the application.
 * This is an alternate way of sharing code; most of the common routines
 * are included in the Utility Service, however we have some base classes
 * that cannot use an angular service.
 */

export function fisherYatesShuffle(items: any[]): void {
  // Performs a Fisher-Yates shuffle
  // https://bost.ocks.org/mike/shuffle/

  let lastIndex = items.length;
  while (lastIndex) {
    // Get a random index with the max value of the last index
    const randomIndex = Math.floor(Math.random() * lastIndex--);
    //  Temporarily save the last "unpicked" item of the array
    const lastItem = items[lastIndex];
    // Place the random item at the end of the array
    items[lastIndex] = items[randomIndex];
    // Place the unpicked item in the spot where we picked the random item
    items[randomIndex] = lastItem;
  }
}

export const appName = 'SoloPlayer';
export const cryptKey = '6f495abd-3746-40d8-9ea2-83a97e0310d7';