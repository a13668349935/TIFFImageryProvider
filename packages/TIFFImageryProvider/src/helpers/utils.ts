import { Color } from "cesium";
import { TypedArray } from "geotiff";

export function getMinMax(data: number[], nodata: number) {
  let min: number, max: number;
  for (let j = 0; j < data.length; j += 1) {
    const val = data[j];
    if (val === nodata) continue;
    if (min === undefined && max === undefined) {
      min = max = val;
      continue;
    }
    if (val < min) {
      min = val;
    } else if (val > max) {
      max = val;
    }
  }
  return {
    min, max
  }
}

export function decimal2rgb(number: number) {
  return Math.round(number * 255)
}

export function getRange(bands: Record<number, {
  min: number;
  max: number;
}>, opts: {
  min?: number,
  max?: number,
  band: number
} | undefined) {
  const band = bands[opts.band]
  if (!band) {
    throw new Error(`Invalid band${opts.band}`)
  }
  const min = opts?.min ?? +band.min;
  const max = opts?.max ?? +band.max;
  const range = max - min;
  return { min, max, range };
}

export function generateColorScale(colors: [number, string][] | string[], minMax: number[]) {
  let stops: [number, string][];

  if (typeof colors[0] === 'string') {
    stops = (colors as string[]).map((color, index) => [index / colors.length, color])
  } else {
    const [min, max] = minMax;
    stops = (colors as [number, string][]).map(item => [((item[0] - min) / (max - min)), item[1]])
  }

  stops.sort((a, b) => a[0] - b[0]);
  // delete extra break points
  let i = stops.length - 1;
  while (i > 1 && stops[i][0] >= 1 && stops[i - 1][0] >= 1) {
    stops.pop();
    i--;
  }

  if (stops[0][0] > 0) {
    stops = [[0, stops[0][1]], ...stops]
  }

  const colorScale = {
    colors: stops.map(stop => stop[1]),
    positions: stops.map(stop => {
      let s = stop[0];
      if (s < 0) return 0;
      if (s > 1) return 1;
      return s;
    }),
  }

  return colorScale;
}

export function findAndSortBandNumbers(str: string) {
  const regex = /b(\d+)/g;
  const bandNumbers = new Set<number>();
  let match: string[];
  while ((match = regex.exec(str)) !== null) {
    bandNumbers.add(parseInt(match[1]) - 1);
  }
  return Array.from(bandNumbers).sort((a, b) => a - b);
}

export function stringColorToRgba(color: string) {
  const newColor = Color.fromCssColorString(color);
  const { red, green, blue, alpha } = newColor;

  return [red, green, blue, alpha].map(val => Math.round(val * 255));
}

export async function reverseArray({ array, width, height }: { array: TypedArray, width: number, height: number }): Promise<TypedArray> {
  const newArray = new (array.constructor as any)(array.length);
  for (let i = 0; i < height; i++) {
    const srcRow = (height - 1 - i) * width;
    const dstRow = i * width;
    for (let j = 0; j < width; j++) {
      newArray[dstRow + j] = array[srcRow + j];
    }
  }
  return newArray;
}

// Converts YCbCr pixel data to RGB
// Assumes yBand, cbBand, crBand are TypedArrays of the same length (width * height)
// Assumes YCbCr values are in standard range (Y: 0-255, Cb/Cr: 0-255 with 128 as zero)
export function ycbcrToRgb(
  yBand: TypedArray,
  cbBand: TypedArray,
  crBand: TypedArray,
  width: number,
  height: number
): { r: Uint8ClampedArray, g: Uint8ClampedArray, b: Uint8ClampedArray } {
  const pixelCount = width * height;
  const r = new Uint8ClampedArray(pixelCount);
  const g = new Uint8ClampedArray(pixelCount);
  const b = new Uint8ClampedArray(pixelCount);

  for (let i = 0; i < pixelCount; i++) {
    const y = yBand[i];
    const cb = cbBand[i];
    const cr = crBand[i];

    // Standard ITU-R BT.601 conversion
    // Cb and Cr are offset by 128
    const cr_adj = cr - 128;
    const cb_adj = cb - 128;

    r[i] = y + 1.402 * cr_adj;
    g[i] = y - 0.344136 * cb_adj - 0.714136 * cr_adj;
    b[i] = y + 1.772 * cb_adj;
  }
  return { r, g, b };
}

/*
// Conceptual Unit Test for ycbcrToRgb
// This should be adapted and placed in the project's actual test suite (e.g., using Jest or Mocha).

describe('ycbcrToRgb', () => {
  it('should correctly convert YCbCr to RGB for a single pixel', () => {
    // Example YCbCr values (e.g., a gray color)
    // Y = 128, Cb = 128, Cr = 128
    // Expected RGB (approx): R=128, G=128, B=128
    const yBand = new Uint8Array([128]);
    const cbBand = new Uint8Array([128]);
    const crBand = new Uint8Array([128]);
    const width = 1;
    const height = 1;

    const { r, g, b } = ycbcrToRgb(yBand, cbBand, crBand, width, height);

    expect(r[0]).toBeCloseTo(128, 0);
    expect(g[0]).toBeCloseTo(128, 0);
    expect(b[0]).toBeCloseTo(128, 0);
  });

  it('should correctly convert a known color YCbCr to RGB (e.g., pure green in BT.601)', () => {
    // Y = 149.686, Cb = 43.419, Cr = 21.16 // Values for R=0, G=255, B=0 (approx)
    // For Uint8Array, we'd use rounded values.
    // Let's pick a simpler example: Y=82, Cb=90, Cr=240 (should give a reddish color)
    // Y = 82, Cb = 90, Cr = 240
    // R = 82 + 1.402 * (240 - 128) = 82 + 1.402 * 112 = 82 + 157.024 = 239.024 -> 239
    // G = 82 - 0.344136 * (90 - 128) - 0.714136 * (240 - 128)
    //   = 82 - 0.344136 * (-38) - 0.714136 * (112)
    //   = 82 + 13.077 - 79.983 = 15.094 -> 15
    // B = 82 + 1.772 * (90 - 128) = 82 + 1.772 * (-38) = 82 - 67.336 = 14.664 -> 15
    const yBand = new Uint8Array([82]);
    const cbBand = new Uint8Array([90]);
    const crBand = new Uint8Array([240]);
    const width = 1;
    const height = 1;

    const { r, g, b } = ycbcrToRgb(yBand, cbBand, crBand, width, height);

    expect(r[0]).toBe(239); // Clamped
    expect(g[0]).toBe(15);  // Clamped
    expect(b[0]).toBe(15);  // Clamped
  });

  it('should handle clamping to 0-255', () => {
    // Values that would go out of bounds
    const yBand = new Uint8Array([255, 0, 100]); // Y value for 3 pixels
    const cbBand = new Uint8Array([128, 200, 50]); // Cb, Cr chosen to produce out-of-bounds
    const crBand = new Uint8Array([255, 10, 200]);
    const width = 3;
    const height = 1;

    const { r, g, b } = ycbcrToRgb(yBand, cbBand, crBand, width, height);

    // Check that all values are within 0-255 range (Uint8ClampedArray handles this)
    r.forEach(val => { expect(val).toBeGreaterThanOrEqual(0); expect(val).toBeLessThanOrEqual(255); });
    g.forEach(val => { expect(val).toBeGreaterThanOrEqual(0); expect(val).toBeLessThanOrEqual(255); });
    b.forEach(val => { expect(val).toBeGreaterThanOrEqual(0); expect(val).toBeLessThanOrEqual(255); });

    // Example for first pixel: Y=255, Cb=128, Cr=255
    // R = 255 + 1.402 * (255 - 128) = 255 + 1.402 * 127 = 255 + 178.054 = 433.054 -> 255 (clamped)
    expect(r[0]).toBe(255);
  });
});
*/
