import type { ThermalGrid } from '../../../../core/models/thermal.model';
/** Shared scalar transfer function: fixed absolute °C, never per-frame normalization. */
export const TEMPERATURE_STOPS = [
  [-20, 0, 65, 148], [-10, 0, 164, 210], [0, 194, 225, 238],
  [10, 255, 255, 234], [15, 255, 196, 82], [20, 255, 79, 15],
  [25, 224, 0, 37], [30, 157, 0, 38], [35, 72, 0, 25], [40, 8, 1, 10],
] as const;

export function colorAt(celsius: number): number[] {
  const t = Math.max(-20, Math.min(40, celsius));
  for (let i = 1; i < TEMPERATURE_STOPS.length; i++) {
    const a = TEMPERATURE_STOPS[i - 1], b = TEMPERATURE_STOPS[i];
    if (t <= b[0]) {
      const f = (t - a[0]) / (b[0] - a[0]);
      return [1,2,3].map(k => Math.round(a[k] + (b[k] - a[k]) * f));
    }
  }
  return [8,1,10];
}

export function validateGrid(g: ThermalGrid): void {
  if (g.schema_version !== 1 || g.unit !== '°C' || g.statistic !== 'daily_mean' || g.variable !== 'air_temperature_2m' ||
      g.width < 2 || g.height < 2 || g.width > 1440 || g.height > 721 ||
      g.width !== g.longitudes.length || g.height !== g.latitudes.length || g.values.length !== g.width*g.height) {
    throw new Error('Invalid global temperature grid');
  }
  if (g.latitudes.some((v,i,a) => !Number.isFinite(v) || Math.abs(v)>90 || (i>0 && v>=a[i-1])) ||
      g.longitudes.some((v,i,a) => !Number.isFinite(v) || v < -180 || v >=180 || (i>0 && Math.abs(v-a[i-1]-360/g.width) > .001)) ||
      Math.abs(g.longitudes[0]+180) > .001 || g.latitudes[0]<88 || g.latitudes[g.height-1]>-88 ||
      g.values.some(v => v !== null && (!Number.isFinite(v) || v < -123.15 || v > 126.85))) {
    throw new Error('Invalid temperature values or geographic coordinates');
  }
}

/** Interpolate native scalar nodes. Longitude wraps; latitude is nonuniform (Gaussian).
 * No infilling: a missing contributor with nonzero weight makes the pixel transparent.
 * Outermost source rows extend to the pole for display, as disclosed in metadata.
 */
export function sampleGrid(g: ThermalGrid, latitude: number, longitude: number): number | null {
  const lon = ((longitude + 180) % 360 + 360) % 360 - 180;
  const x = (lon - g.longitudes[0]) / (360 / g.width);
  const x0 = Math.floor(x) % g.width, x1 = (x0 + 1) % g.width, fx = x - Math.floor(x);
  let low = 0, high = g.height - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (g.latitudes[middle] >= latitude) low = middle; else high = middle;
  }
  const fy = Math.max(0, Math.min(1, (g.latitudes[low] - latitude) / (g.latitudes[low] - g.latitudes[high])));
  const contributors = [
    [g.values[low*g.width+x0], (1-fx)*(1-fy)], [g.values[low*g.width+x1], fx*(1-fy)],
    [g.values[high*g.width+x0], (1-fx)*fy], [g.values[high*g.width+x1], fx*fy],
  ];
  let value = 0;
  for (const [v,w] of contributors) {
    if (w === null || w <= 1e-10) continue;
    if (v === null) return null;
    value += v*w;
  }
  return value;
}

export function rasterize(g: ThermalGrid, width = 1024, height = 512): Uint8ClampedArray {
  validateGrid(g);
  const pixels = new Uint8ClampedArray(width*height*4);
  for (let y=0;y<height;y++) {
    const lat = 90 - (y+.5)*180/height;
    for (let x=0;x<width;x++) {
      const v = sampleGrid(g,lat,-180+(x+.5)*360/width);
      if (v === null) continue;
      const offset = (y*width+x)*4;
      pixels.set(colorAt(v),offset); pixels[offset+3] = 255;
    }
  }
  return pixels;
}
