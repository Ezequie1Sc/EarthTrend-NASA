import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { geographicVector, geographicCoordinates } from './geography';
import { colorAt, rasterize, sampleGrid } from './thermal-raster';
import type { ThermalGrid } from '../../../../core/models/thermal.model';
// Analytical fixtures ONLY. Production always receives an attributed scientific grid.
const grid = {
  schema_version:1,unit:'°C',variable:'air_temperature_2m',statistic:'daily_mean',
  width:4,height:3,longitudes:[-180,-90,0,90],latitudes:[90,20,-90],
  values:[-20,-10,0,10, 0,10,20,30, 20,30,40,50],
} as ThermalGrid;

describe('Thermal grid geography',()=>{
  it('samples native coordinates without shifting Greenwich or the hemispheres',()=>{
    expect(sampleGrid(grid,20,0)).toBe(20);
    expect(sampleGrid(grid,90,-180)).toBe(-20);
    expect(sampleGrid(grid,-90,0)).toBe(40);
  });
  it('uses actual Gaussian latitude distances, not a linear row index',()=>{
    expect(sampleGrid(grid,55,0)).toBe(10);
    expect(sampleGrid(grid,-35,0)).toBe(30);
  });
  it('interpolates across the antimeridian periodically',()=>{
    expect(sampleGrid(grid,20,180)).toBe(sampleGrid(grid,20,-180));
    expect(sampleGrid(grid,20,179.999)).toBeCloseTo(sampleGrid(grid,20,-180.001)!,8);
    expect(sampleGrid(grid,20,135)).toBe(15);
  });
  it('never replaces missing contributors with zero',()=>{
    const missing={...grid,values:[...grid.values]};missing.values[6]=null;
    expect(sampleGrid(missing,20,0)).toBeNull();
    expect(sampleGrid(missing,20,-45)).toBeNull();
    expect(sampleGrid(missing,20,-90)).toBe(10);
    const pixels=rasterize({...grid,values:Array(12).fill(null)},8,4);
    expect(pixels.every(v=>v===0)).toBe(true);
  });
  it('rasterizes north at the top and samples pixel centers',()=>{
    const p=rasterize(grid,4,2);
    expect([...p.slice(0,3)]).toEqual(colorAt(sampleGrid(grid,45,-135)!));
    expect([...p.slice(16,19)]).toEqual(colorAt(sampleGrid(grid,-45,-135)!));
  });
  it('clips extremes on a fixed absolute color scale',()=>{
    expect(colorAt(-90)).toEqual(colorAt(-20));
    expect(colorAt(60)).toEqual(colorAt(40));
    expect(colorAt(10)).toEqual([255,255,234]);
  });
  it('rejects malformed dimensions and coordinate order',()=>{
    expect(()=>rasterize({...grid,width:5})).toThrow();
    expect(()=>rasterize({...grid,latitudes:[-90,20,90]})).toThrow();
    expect(()=>rasterize({...grid,unit:'K'} as unknown as ThermalGrid)).toThrow();
  });
  it.each([[0,0],[20,-90],[-33,151],[51,0],[0,179],[0,-179]])('roundtrips marker coordinates %s, %s',(lat,lon)=>{
    const c=geographicCoordinates(geographicVector(lat,lon));
    expect(c.latitude).toBeCloseTo(lat,8);expect(c.longitude).toBeCloseTo(lon,8);
  });
  it('matches actual Three.js SphereGeometry UV vertices',()=>{
    const sphere=new THREE.SphereGeometry(1,36,18);
    const p=sphere.getAttribute('position'),uv=sphere.getAttribute('uv');
    for(let i=0;i<p.count;i++) {
      const lat=uv.getY(i)*180-90;
      if(Math.abs(lat)>89)continue; // Three offsets pole UVs intentionally.
      const expected=geographicVector(lat,uv.getX(i)*360-180);
      expect(expected.distanceTo(new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)))).toBeLessThan(1e-6);
    }
    sphere.dispose();
  });
});
