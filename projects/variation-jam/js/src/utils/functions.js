/**
 * Creates a throttled version of a function that only runs once every `delay` milliseconds,
 * no matter how many times it’s called.
 *
 * @attribution Implemented by ChatGPT 5.0 Thinking to avoid bundling lodash
 *
 * @template {(...args: any[]) => any} F
 * @param {F} fn - The function to throttle
 * @param {number} delay - The minimum time (in ms) between calls
 * @param {boolean} [leading=true] - Whether to run on the leading edge
 * @param {boolean} [trailing=true] - Whether to run on the trailing edge
 * @returns {(...args: Parameters<F>) => void}
 */
export function throttle(fn, delay, leading = true, trailing = true) {
  let lastCall = 0;
  let timeout = null;
  let lastArgs;
  let lastThis;

  const invoke = () => {
    lastCall = Date.now();
    timeout = null;
    fn.apply(lastThis, lastArgs);
  };

  return function (...args) {
    const now = Date.now();

    if (!lastCall && !leading) lastCall = now;
    const remaining = delay - (now - lastCall);

    lastArgs = args;
    lastThis = this;

    if (remaining <= 0 || remaining > delay) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      invoke();
    } else if (!timeout && trailing) {
      timeout = setTimeout(invoke, remaining);
    }
  };
}

/**
 * between
 *
 * Checks whether value is between min and max. Syntactic sugar of sorts for improved readability.
 *
 * 100% manually implemented.
 */
export function between(value, min, max) {
  return value >= min && value <= max;
}
