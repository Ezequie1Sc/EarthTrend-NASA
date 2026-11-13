/// <reference lib="webworker" />
import { rasterize } from './thermal-raster';
import type { ThermalGrid } from '../../../../core/models/thermal.model';
addEventListener('message', ({ data }: MessageEvent<ThermalGrid>) => {
  try {
    const pixels = rasterize(data);
    postMessage({ pixels: pixels.buffer, width: 1024, height: 512 }, [pixels.buffer]);
  } catch (error) { postMessage({ error: error instanceof Error ? error.message : 'Texture processing failed' }); }
});
