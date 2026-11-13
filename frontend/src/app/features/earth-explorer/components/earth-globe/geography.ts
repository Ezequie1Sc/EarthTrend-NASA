import * as THREE from 'three';
/** Same convention as unrotated Three SphereGeometry and the equirectangular map.
 * u=(longitude+180)/360; v=(latitude+90)/180; Greenwich is +X, east is -Z.
 */
export function geographicVector(latitude: number, longitude: number, radius = 1): THREE.Vector3 {
  const lat = latitude*Math.PI/180, lon = longitude*Math.PI/180;
  return new THREE.Vector3(radius*Math.cos(lat)*Math.cos(lon),radius*Math.sin(lat),-radius*Math.cos(lat)*Math.sin(lon));
}
export function geographicCoordinates(v: THREE.Vector3) {
  const n = v.clone().normalize();
  return { latitude: Math.asin(Math.max(-1,Math.min(1,n.y)))*180/Math.PI, longitude: Math.atan2(-n.z,n.x)*180/Math.PI };
}

export function createBoundaries(geojson: {features: {geometry: {type: string; coordinates: number[][][] | number[][][][]}}[]}, radius: number): THREE.LineSegments {
  const positions: number[] = [];
  for (const f of geojson.features) {
    const polygons = f.geometry.type === 'Polygon' ? [f.geometry.coordinates as number[][][]] : f.geometry.coordinates as number[][][][];
    for (const polygon of polygons) for (const ring of polygon) for (let i=1;i<ring.length;i++) {
      const a = ring[i-1], b = ring[i];
      let delta = ((b[0]-a[0]+540)%360)-180;
      const steps = Math.max(1,Math.ceil(Math.max(Math.abs(delta),Math.abs(b[1]-a[1]))));
      for (let j=0;j<steps;j++) {
        for (const t of [j/steps,(j+1)/steps]) positions.push(...geographicVector(a[1]+(b[1]-a[1])*t,a[0]+delta*t,radius).toArray());
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  const lines = new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xe4effa,transparent:true,opacity:.48,depthWrite:false,toneMapped:false}));
  lines.renderOrder = 3;
  return lines;
}
