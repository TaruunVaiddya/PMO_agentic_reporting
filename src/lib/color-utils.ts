/**
 * Color Utilities
 * Helper functions for color conversions
 */

/**
 * Convert RGB/RGBA string to hex color
 */
export function rgbToHex(rgb: string): string {
  // Already hex
  if (rgb.startsWith('#')) {
    return rgb;
  }

  // Parse rgb() or rgba()
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) {
    return '#000000'; // Default fallback
  }

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return '#' + [r, g, b]
    .map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    })
    .join('');
}

/**
 * Ensure color is in hex format for color input
 */
export function normalizeColor(color: string): string {
  if (!color || color === 'transparent' || color === 'none') {
    return '#ffffff';
  }
  return rgbToHex(color);
}
