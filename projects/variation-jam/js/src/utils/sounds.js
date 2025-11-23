/**
 * @typedef {import('p5').SoundFile} P5SoundFile
 */

/**
 * Centralized SoundBook.
 *
 * Copy of FontBook pattern.
 *
 * @see ./fonts.js
 *
 * 100% manually implemented.
 */
export default class SoundBook {
  /**
   * Unique sentinel for "loading"
   * @type {symbol}
   */
  static LoadingSentinel = Symbol("SoundLoading");

  /**
   * Unique sentinel for "error"
   * @type {symbol}
   */
  static ErrorSentinel = Symbol("SoundError");

  /**
   * Sounds
   * @type {Map<string, P5SoundFile | symbol>}
   */
  static _sounds = new Map();

  /**
   * Sound Promises
   * @type {Map<string, Promise<P5SoundFile>>}
   */
  static _soundPromises = new Map();

  /**
   * Start loading a sound (if not already started).
   * Returns the internal Promise, but callers don't *have* to use it.
   *
   * @param {import('p5')} p5
   * @param {string} key
   * @param {string} path
   * @returns {Promise<P5SoundFile>}  // mainly for tests / advanced callers
   */
  static load(p5, key, path) {
    if (SoundBook._soundPromises.has(key)) {
      return SoundBook._soundPromises.get(key);
    }

    // mark as loading in the sync map
    SoundBook._sounds.set(key, SoundBook.LoadingSentinel);

    const promise = new Promise((resolve, reject) => {
      p5.loadSound(
        path,
        (sound) => {
          SoundBook._sounds.set(key, sound);
          resolve(sound);
        },
        (err) => {
          SoundBook._sounds.set(key, SoundBook.ErrorSentinel);
          reject(err);
        }
      );
    });

    // Catch rejections to avoid 'unhandled rejection' warnings.
    promise.catch((err) => {
      console.error(`SoundBook: Failed to load sound "${key}":`, err);
    });

    SoundBook._soundPromises.set(key, promise);
    return promise;
  }

  /**
   * Synchronous getter.
   *
   * @param {string} key
   * @returns {P5SoundFile | typeof SoundBook.LoadingSentinel | typeof SoundBook.ErrorSentinel | null}
   */
  static get(key) {
    return SoundBook._sounds.get(key) ?? null;
  }

  /**
   * Synchronous getter of loading Promise.
   *
   * @param {string} key
   * @returns {Promise<P5SoundFile>}
   */
  static getPromise(key) {
    return SoundBook._soundPromises.get(key) ?? null;
  }

  static isSentinel(obj) {
    return obj === SoundBook.LoadingSentinel || obj === SoundBook.ErrorSentinel;
  }
}
