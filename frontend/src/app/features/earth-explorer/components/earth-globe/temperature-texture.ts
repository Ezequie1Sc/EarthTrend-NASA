import { InjectionToken } from '@angular/core';
import * as THREE from 'three';
import type { ThermalGrid } from '../../../../core/models/thermal.model';
/** Each request owns a worker. Cancelling a date also cancels CPU processing. */
export function createTemperatureTexture(grid: ThermalGrid, signal: AbortSignal): Promise<THREE.DataTexture> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return; }
    const worker = new Worker(new URL('./thermal.worker', import.meta.url), { type: 'module' });
    const finish = () => { clearTimeout(timer); worker.terminate(); signal.removeEventListener('abort', abort); };
    const abort = () => { finish(); reject(new DOMException('Aborted', 'AbortError')); };
    const timer = setTimeout(() => { finish(); reject(new Error('Temperature processing timed out')); }, 20000);
    signal.addEventListener('abort', abort, { once: true });
    worker.onerror = () => { finish(); reject(new Error('Temperature worker failed. Check Web Worker support and CSP.')); };
    worker.onmessage = ({ data }) => {
      finish();
      if (data.error) { reject(new Error(data.error)); return; }
      const texture = new THREE.DataTexture(new Uint8Array(data.pixels), data.width, data.height, THREE.RGBAFormat);
      // Worker row 0 is north; SphereGeometry UV v=1 is north. WebGL upload flips rows.
      texture.flipY = true;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.magFilter = THREE.LinearFilter;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      resolve(texture);
    };
    worker.postMessage(grid);
  });
}

export const TEMPERATURE_TEXTURE_FACTORY = new InjectionToken<typeof createTemperatureTexture>('TEMPERATURE_TEXTURE_FACTORY', {providedIn:'root', factory:()=>createTemperatureTexture});
