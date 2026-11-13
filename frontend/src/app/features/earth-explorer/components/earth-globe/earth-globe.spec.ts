import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as THREE from 'three';
import { TemperatureGridService } from '../../../../core/services/temperature-grid.service';
import { ThermalGrid } from '../../../../core/models/thermal.model';
import { EarthGlobe } from './earth-globe';
import { TEMPERATURE_TEXTURE_FACTORY } from './temperature-texture';
const createTemperatureTexture = vi.fn();
const data = (date: string) => ({ date, provider:'noaa', valid_cells:18048 } as ThermalGrid);
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('Thermal lifecycle and interactions', () => {
  let globe: EarthGlobe;
  let requests: Subject<ThermalGrid>[];
  beforeEach(() => {
    vi.resetAllMocks(); requests=[];
    TestBed.configureTestingModule({providers:[{provide:TemperatureGridService,useValue:{
      sources:()=>of([]),getTemperatureGrid:()=>{const s=new Subject<ThermalGrid>();requests.push(s);return s;},
    }}, {provide: TEMPERATURE_TEXTURE_FACTORY, useValue: createTemperatureTexture}]});
    globe=TestBed.runInInjectionContext(()=>new EarthGlobe());
  });
  it('replaces the date and disposes its previous texture',async()=>{
    const texture = new THREE.DataTexture();const dispose=vi.spyOn(texture,'dispose');
    vi.mocked(createTemperatureTexture).mockResolvedValue(texture);
    globe.loadTemperatureOverlay();requests[0].next(data('2024-06-15'));await flush();
    expect(globe.loadedGrid()?.date).toBe('2024-06-15');
    globe.changeDate('2024-12-15');
    expect(dispose).toHaveBeenCalledOnce();expect(globe.loadedGrid()).toBeNull();
    requests[1].next(data('2024-12-15'));await flush();
    expect(globe.loadedGrid()?.date).toBe('2024-12-15');expect(globe.temperatureLoading()).toBe(false);
    globe.ngOnDestroy();
  });
  it('aborts an obsolete worker and rejects its late texture',async()=>{
    let finish!: (t:THREE.DataTexture)=>void;
    const old = new THREE.DataTexture();const dispose=vi.spyOn(old,'dispose');
    vi.mocked(createTemperatureTexture).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
    globe.loadTemperatureOverlay();requests[0].next(data('2024-06-15'));
    const abort=vi.mocked(createTemperatureTexture).mock.calls[0][1];
    globe.changeDate('2024-12-15');expect(abort.aborted).toBe(true);
    finish(old);await flush();expect(dispose).toHaveBeenCalledOnce();expect(globe.loadedGrid()).toBeNull();
    globe.ngOnDestroy();
  });
  it('never labels an upstream substituted date as the requested one',async()=>{
    globe.loadTemperatureOverlay();requests[0].next(data('2024-06-16'));await flush();
    expect(createTemperatureTexture).not.toHaveBeenCalled();
    expect(globe.temperatureError()).toContain('different date');
    expect(globe.loadedGrid()).toBeNull();globe.ngOnDestroy();
  });
  it('shows API failures and allows retry without retaining stale data',()=>{
    globe.loadTemperatureOverlay();requests[0].error({error:{detail:'NOAA timed out'}});
    expect(globe.temperatureError()).toBe('NOAA timed out');expect(globe.temperatureLoading()).toBe(false);
    globe.retry();expect(globe.temperatureLoading()).toBe(true);expect(globe.temperatureError()).toBeNull();globe.ngOnDestroy();
  });
  it('clamps opacity and preserves surface mode independently of pending data',()=>{
    globe.changeOpacity(145);expect(globe.overlayOpacity()).toBe(100);
    globe.changeOpacity(-1);expect(globe.overlayOpacity()).toBe(0);
    globe.changeOpacity(NaN);expect(globe.overlayOpacity()).toBe(0);
    globe.setLayer('surface');expect(globe.activeLayer()).toBe('surface');
    globe.ngOnDestroy();
  });
});
