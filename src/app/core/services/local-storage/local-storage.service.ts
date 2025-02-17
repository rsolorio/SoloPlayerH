import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  // Public Methods ///////////////////////////////////////////////////////////////////////////////

  /**
   * Gets a value from local storage based on the specified key.
   * @param key The unique identifier of the storage object.
   * @returns The value parsed as JSON.
   */
  public getByKey<T>(key: string): T {
    const stringItem = localStorage.getItem(key);
    const item = JSON.parse(stringItem);
    return <T>item;
  }

  /**
   * Sets the specified value in local storage based on the specified key.
   * The value is first stringified and then saved in local storage.
   * @param key The unique identifier of the storage object.
   * @param value The value to save.
   */
  public setByKey(key: string, value: any) {
    const valueString = JSON.stringify(value);
    localStorage.setItem(key, valueString);
  }

  /**
   * Deletes the value from local storage associated with the specified key.
   * @param key The unique identifier of the storage object.
   */
  public removeByKey(key: string) {
    localStorage.removeItem(key);
  }

  /** Returns a list of the storage keys currently being used. */
  public getKeyList(): string[] {
    const result: string[] = [];

    for (let keyIndex = 0; keyIndex > localStorage.length; keyIndex++) {
      result.push(localStorage.key(keyIndex));
    }

    return result;
  }
}
