
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  input,
  output,
  signal,
} from '@angular/core';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface GlobeLocation {
  latitude: number;
  longitude: number;
}

export type GlobeLayer = 'surface' | 'temperature';

@Component({
  selector: 'app-earth-globe',
  standalone: true,
  template: `
    <div class="relative h-full min-h-[560px] w-full overflow-hidden bg-[#020817]">
      <div
        #globeContainer
        class="absolute inset-0"
        aria-label="Interactive three-dimensional Earth"
      ></div>

      <div class="absolute left-5 top-5 z-10 flex flex-col gap-2">
        <button
          type="button"
          (click)="setLayer('surface')"
          [class.border-sky-400]="activeLayer() === 'surface'"
          [class.bg-sky-900]="activeLayer() === 'surface'"
          class="rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-2 text-left text-sm text-white backdrop-blur-md hover:border-sky-500"
        >
          Earth Surface
        </button>

        <button
          type="button"
          disabled
          title="Requires global gridded temperature observations"
          class="cursor-not-allowed rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2 text-left text-sm text-slate-500 opacity-75"
        >
          Temperature Overlay · Coming soon
        </button>
      </div>

      <div
        class="absolute right-5 top-5 z-10 flex flex-col overflow-hidden rounded-xl border border-sky-900 bg-slate-950/85 backdrop-blur-md"
      >
        <button
          type="button"
          (click)="zoomIn()"
          aria-label="Zoom in"
          class="border-b border-slate-700 px-4 py-3 text-xl text-white hover:bg-sky-900"
        >
          +
        </button>

        <button
          type="button"
          (click)="zoomOut()"
          aria-label="Zoom out"
          class="border-b border-slate-700 px-4 py-3 text-xl text-white hover:bg-sky-900"
        >
          −
        </button>

        <button
          type="button"
          (click)="resetView()"
          aria-label="Reset globe view"
          class="px-4 py-3 text-sm text-white hover:bg-sky-900"
        >
          Reset
        </button>
      </div>

      @if (selectedLocation(); as location) {
        <div
          class="absolute bottom-20 right-5 z-10 rounded-xl border border-sky-500/40 bg-slate-950/90 px-4 py-3 text-sm text-white backdrop-blur-md"
        >
          <p class="font-semibold text-sky-300">
            Selected location
          </p>

          <p class="mt-1">
            {{ location.latitude }}°,
            {{ location.longitude }}°
          </p>

          <p class="mt-1 text-xs text-slate-400">
            Coordinates ready for climate analysis
          </p>
        </div>
      }

      <div
        class="pointer-events-none absolute bottom-5 left-5 z-10 rounded-xl border border-sky-400/20 bg-slate-950/80 px-4 py-3 text-xs text-slate-300 backdrop-blur-md"
      >
        <p class="font-semibold text-sky-300">
          Earth Explorer
        </p>

        <p class="mt-1">
          Drag to rotate · Scroll to zoom
        </p>

        <p class="mt-1">
          Double-click to select a location
        </p>

        <p class="mt-1 text-slate-400">
          Geographic imagery · Not a temperature map
        </p>
      </div>
    </div>
  `,
})
export class EarthGlobe implements AfterViewInit, OnDestroy {
  @ViewChild('globeContainer', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  readonly latitude = input(19.845);
  readonly longitude = input(-90.523);

  readonly locationSelected = output<GlobeLocation>();

  readonly activeLayer = signal<GlobeLayer>('surface');

  readonly selectedLocation =
    signal<GlobeLocation | null>(null);

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;

  private earth!: THREE.Mesh;
  private cloudMesh?: THREE.Mesh;
  private marker?: THREE.Group;

  private readonly radius = 2;

  // Distancia inicial ajustada para evitar que
  // el planeta ocupe todo el panel.
  private readonly initialDistance = 6.2;

  private readonly textures: THREE.Texture[] = [];

  private animationFrame = 0;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  ngAfterViewInit(): void {
    this.initializeScene();
    this.createStars();
    this.createEarth();
    this.configureControls();
    this.configureResize();
    this.resetView();
    this.animate();
  }

  private initializeScene(): void {
    const container = this.containerRef.nativeElement;

    this.scene = new THREE.Scene();

    this.scene.background = new THREE.Color('#020817');

    this.camera = new THREE.PerspectiveCamera(
      45,
      Math.max(container.clientWidth, 1) /
        Math.max(container.clientHeight, 1),
      0.1,
      100,
    );

    this.camera.position.set(
      0,
      0,
      this.initialDistance,
    );

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2),
    );

    this.renderer.setSize(
      Math.max(container.clientWidth, 1),
      Math.max(container.clientHeight, 1),
    );

    this.renderer.outputColorSpace =
      THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      1.15,
    );

    this.scene.add(ambientLight);

    const sunlight = new THREE.DirectionalLight(
      0xffffff,
      2.3,
    );

    sunlight.position.set(5, 3, 5);
    this.scene.add(sunlight);

    const rimLight = new THREE.DirectionalLight(
      0x38bdf8,
      1.35,
    );

    rimLight.position.set(-4, -2, -4);
    this.scene.add(rimLight);
  }

  private createEarth(): void {
    const geometry = new THREE.SphereGeometry(
      this.radius,
      128,
      96,
    );

    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      shininess: 18,
    });

    this.earth = new THREE.Mesh(geometry, material);

    this.scene.add(this.earth);

    const loader = new THREE.TextureLoader();

    loader.load(
      '/textures/earth/earth-surface.jpg',
      (texture) => {
        if (this.destroyed) {
          texture.dispose();
          return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;

        texture.anisotropy = Math.min(
          this.renderer.capabilities.getMaxAnisotropy(),
          8,
        );

        this.textures.push(texture);

        material.map = texture;
        material.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.error(
          'Unable to load Earth surface texture:',
          error,
        );
      },
    );

    loader.load(
      '/textures/earth/earth-specular.jpg',
      (texture) => {
        if (this.destroyed) {
          texture.dispose();
          return;
        }

        this.textures.push(texture);

        material.specularMap = texture;
        material.specular = new THREE.Color(0x555555);
        material.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.warn(
          'Earth specular texture unavailable:',
          error,
        );
      },
    );

    this.createClouds(loader);
    this.createAtmosphere();
  }

  private createClouds(
    loader: THREE.TextureLoader,
  ): void {
    const geometry = new THREE.SphereGeometry(
      this.radius * 1.012,
      96,
      64,
    );

    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });

    this.cloudMesh = new THREE.Mesh(
      geometry,
      material,
    );

    this.scene.add(this.cloudMesh);

    loader.load(
      '/textures/earth/earth-clouds.png',
      (texture) => {
        if (this.destroyed) {
          texture.dispose();
          return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;

        this.textures.push(texture);

        material.map = texture;
        material.opacity = 0.28;
        material.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.warn(
          'Earth cloud texture unavailable:',
          error,
        );
      },
    );
  }

  private createAtmosphere(): void {
    const geometry = new THREE.SphereGeometry(
      this.radius * 1.035,
      96,
      64,
    );

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.BackSide,
      uniforms: {
        glowColor: {
          value: new THREE.Color(0x38bdf8),
        },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vNormal = normalize(normalMatrix * normal);

          vec4 viewPosition =
            modelViewMatrix * vec4(position, 1.0);

          vPosition = viewPosition.xyz;

          gl_Position =
            projectionMatrix * viewPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;

        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
          vec3 viewDirection = normalize(-vPosition);

          float intensity = pow(
            1.0 - abs(
              dot(normalize(vNormal), viewDirection)
            ),
            3.0
          );

          gl_FragColor = vec4(
            glowColor,
            intensity * 0.55
          );
        }
      `,
    });

    this.scene.add(
      new THREE.Mesh(geometry, material),
    );
  }

  private createStars(): void {
    const count = 1400;

    const positions = new Float32Array(
      count * 3,
    );

    for (let index = 0; index < count; index++) {
      const theta = Math.random() * Math.PI * 2;

      const phi = Math.acos(
        2 * Math.random() - 1,
      );

      const distance = 25 + Math.random() * 35;

      positions[index * 3] =
        distance *
        Math.sin(phi) *
        Math.cos(theta);

      positions[index * 3 + 1] =
        distance * Math.cos(phi);

      positions[index * 3 + 2] =
        distance *
        Math.sin(phi) *
        Math.sin(theta);
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3,
      ),
    );

    const material = new THREE.PointsMaterial({
      color: 0xb7d9ff,
      size: 0.075,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      depthWrite: false,
    });

    this.scene.add(
      new THREE.Points(geometry, material),
    );
  }

  private configureControls(): void {
    this.controls = new OrbitControls(
      this.camera,
      this.renderer.domElement,
    );

    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.055;

    this.controls.enablePan = false;

    this.controls.minDistance = 2.8;
    this.controls.maxDistance = 11;

    this.controls.rotateSpeed = 0.65;
    this.controls.zoomSpeed = 0.8;

    this.renderer.domElement.addEventListener(
      'dblclick',
      this.handleDoubleClick,
    );
  }

  private readonly handleDoubleClick = (
    event: MouseEvent,
  ): void => {
    const bounds =
      this.renderer.domElement.getBoundingClientRect();

    const pointer = new THREE.Vector2(
      ((event.clientX - bounds.left) / bounds.width) *
        2 -
        1,
      -(
        (event.clientY - bounds.top) /
        bounds.height
      ) *
        2 +
        1,
    );

    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(
      pointer,
      this.camera,
    );

    const intersections = raycaster.intersectObject(
      this.earth,
    );

    if (!intersections.length) {
      return;
    }

    const intersection = intersections[0];

    const localPoint = this.earth
      .worldToLocal(intersection.point.clone())
      .normalize();

    const latitude = THREE.MathUtils.radToDeg(
      Math.asin(localPoint.y),
    );

    const longitude = intersection.uv
      ? (intersection.uv.x - 0.5) * 360
      : THREE.MathUtils.radToDeg(
          Math.atan2(
            -localPoint.z,
            localPoint.x,
          ),
        );

    const normalizedLongitude =
      ((longitude + 540) % 360) - 180;

    const location: GlobeLocation = {
      latitude: Number(
        latitude.toFixed(4),
      ),
      longitude: Number(
        normalizedLongitude.toFixed(4),
      ),
    };

    this.selectedLocation.set(location);

    this.updateMarker(localPoint);

    this.locationSelected.emit(location);
  };

  private updateMarker(
    localPoint: THREE.Vector3,
  ): void {
    if (!this.marker) {
      this.marker = new THREE.Group();

      this.earth.add(this.marker);

      const dotGeometry = new THREE.SphereGeometry(
        0.035,
        16,
        12,
      );

      const dotMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
      });

      const dot = new THREE.Mesh(
        dotGeometry,
        dotMaterial,
      );

      this.marker.add(dot);

      const ringGeometry = new THREE.RingGeometry(
        0.055,
        0.085,
        32,
      );

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0x00c8ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
      });

      const ring = new THREE.Mesh(
        ringGeometry,
        ringMaterial,
      );

      this.marker.add(ring);
    }

    this.marker.position.copy(
      localPoint
        .clone()
        .multiplyScalar(
          this.radius * 1.035,
        ),
    );

    this.marker.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      localPoint,
    );
  }

  private configureResize(): void {
    const container = this.containerRef.nativeElement;

    this.resizeObserver = new ResizeObserver(() => {
      const width = Math.max(
        container.clientWidth,
        1,
      );

      const height = Math.max(
        container.clientHeight,
        1,
      );

      this.camera.aspect = width / height;

      this.camera.updateProjectionMatrix();

      this.renderer.setSize(
        width,
        height,
      );
    });

    this.resizeObserver.observe(container);
  }

  private animate = (): void => {
    if (this.destroyed) {
      return;
    }

    this.animationFrame = requestAnimationFrame(
      this.animate,
    );

    this.controls.update();

    if (this.cloudMesh) {
      this.cloudMesh.rotation.y += 0.00012;
    }

    this.renderer.render(
      this.scene,
      this.camera,
    );
  };

  setLayer(layer: GlobeLayer): void {
    if (layer !== 'surface') {
      return;
    }

    this.activeLayer.set('surface');
  }

  zoomIn(): void {
    this.setZoom(0.8);
  }

  zoomOut(): void {
    this.setZoom(1.25);
  }

  resetView(): void {
    // Restaurar la distancia inicial.
    this.camera.position.set(
      0,
      0,
      this.initialDistance,
    );

    this.controls.target.set(
      0,
      0,
      0,
    );

    this.controls.update();

    // Orientación inicial hacia América.
    this.earth.rotation.set(
      0,
      -Math.PI / 2,
      0,
    );

    // Sincronizar las nubes con la Tierra.
    if (this.cloudMesh) {
      this.cloudMesh.rotation.copy(
        this.earth.rotation,
      );
    }
  }

  private setZoom(
    factor: number,
  ): void {
    const distance =
      this.camera.position.length();

    const nextDistance =
      THREE.MathUtils.clamp(
        distance * factor,
        this.controls.minDistance,
        this.controls.maxDistance,
      );

    this.camera.position.setLength(
      nextDistance,
    );

    this.controls.update();
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    cancelAnimationFrame(
      this.animationFrame,
    );

    this.resizeObserver?.disconnect();

    this.renderer?.domElement.removeEventListener(
      'dblclick',
      this.handleDoubleClick,
    );

    this.controls?.dispose();

    this.scene?.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Points
      ) {
        object.geometry.dispose();

        const materials = Array.isArray(
          object.material,
        )
          ? object.material
          : [object.material];

        for (const material of materials) {
          material.dispose();
        }
      }
    });

    for (const texture of this.textures) {
      texture.dispose();
    }

    this.renderer?.dispose();

    this.renderer?.domElement.remove();
  }
}
