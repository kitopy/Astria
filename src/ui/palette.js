// ASTRION color palette, sampled from the original GDevelop art.
// Phaser uses numbers (0xRRGGBB) for shapes and strings ('#rrggbb') for text,
// so each color is exported both ways. The same colors are CSS variables in workshop.css.

const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;

export const COLORS = {
  deep: 0x1c0a33, // night sky of the backgrounds
  panel: 0x3c2454, // NOAH dialog panel
  violet: 0x7050b0, // "Comenzar Misión" button fill
  orchid: 0xd090f0, // neon frames of the observation windows
  glow: 0xf0b0f0, // bright pink of the nebulas: main highlight (buttons, current step)
  pink: 0xf5c7e7, // title "ASTRION"
  gold: 0xffd9a8, // the golden star: success and discoveries
};

export const CSS = Object.fromEntries(Object.entries(COLORS).map(([name, value]) => [name, hex(value)]));
