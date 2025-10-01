/**
 * @typedef {import('p5')} P5
 */

/**
 * @typedef {string | number | [number] | [number, number] | [number, number, number] | [number, number, number, number] | import('p5').Color} P5ColorInput
 */

/**
 * Return a CSS rgba() color string with the given opacity applied.
 *
 * @param {P5} p5 - The p5 instance used for color parsing.
 * @param {P5ColorInput} color - Any value accepted by p5.color().
 * @param {number} alpha - Opacity value in the range [0,1].
 * @returns {string} CSS rgba() string with alpha applied.
 */
export default function withOpacity(p5, color, alpha) {
  const c = Array.isArray(color) ? p5.color(...color) : p5.color(color);
  return `rgba(${p5.red(c)}, ${p5.green(c)}, ${p5.blue(c)}, ${alpha})`;
}
