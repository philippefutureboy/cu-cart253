/**
 * theme.js
 *
 * Contains reusable styling info.
 *
 * My contribution to the "data" part of the course load :P
 *
 */

export const colors = {
  background: "#f0f0ff",

  tag: "#0f0",
  pursuer: "#0f0",
  evader: "#00f",

  player: "#fff",
  npc: "#354a21",

  textH1: "#f00",
  separatorH1: "#f00",
  textDefault: "#00f",
  textBad: "#f00",
};

/**
 * Typo style guide
 *
 * These numbers were obtained through trial and error.
 */
export const typo = {
  "mayas-script": {
    h1: {
      size: 80,
      lineHeight: 88,
    },
    h1Subtitle: {
      size: 48,
      lineHeight: 56,
    },
    li: {
      size: 36,
      lineHeight: 42,
      underlineOffset: { x: 2, y: -6 },
    },
  },
  default: {
    h1: {
      size: 64,
    },
    h2: {
      size: 32,
    },
    li: {
      size: 18,
      lineHeight: 20,
    },
  },
};
