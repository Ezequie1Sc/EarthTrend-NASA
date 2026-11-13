
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ThermalControls } from '../thermal-controls/thermal-controls';
import { ThermalGrid, ThermalProvider, ThermalSource } from '../../../../core/models/thermal.model';
import { geographicCoordinates, createBoundaries } from './geography';
import { TEMPERATURE_STOPS } from './thermal-raster';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import {
  TemperatureGridService,
} from '../../../../core/services/temperature-grid.service';

import {
  TEMPERATURE_TEXTURE_FACTORY,
} from './temperature-texture';

export interface GlobeLocation {
  latitude: number;
  longitude: number;
}

export type GlobeLayer = 'surface' | 'temperature';

@Component({
  selector: 'app-earth-globe',
  standalone: true,
  imports: [ThermalControls],
  templateUrl: './earth-globe.html',
  styleUrl: './earth-globe.css',
})
export class EarthGlobe implements AfterViewInit, OnDestroy {
  @ViewChild('globeContainer', { static: true })
  private containerRef!: ElementRef<HTMLDivElement>;

  private readonly temperatureService =
    inject(TemperatureGridService);

  // --------------------------------------------------
  // INPUTS AND OUTPUTS
  // --------------------------------------------------

  private readonly createTexture = inject(TEMPERATURE_TEXTURE_FACTORY);

  readonly latitude = input(19.845);
  readonly longitude = input(-90.523);

  readonly locationSelected = output<GlobeLocation>();

  // --------------------------------------------------
  // STATE
  // --------------------------------------------------

  readonly activeLayer = signal<GlobeLayer>('temperature');

  readonly selectedLocation =
    signal<GlobeLocation | null>(null);

  readonly temperatureDate = signal('2024-06-15');
  readonly provider = signal<ThermalProvider>('noaa');
  readonly sources = signal<ThermalSource[]>([]);
  readonly loadedGrid = signal<ThermalGrid | null>(null);
  readonly boundaryWarning = signal<string | null>(null);
  readonly webglError = signal<string | null>(null);
  readonly legendTicks = [-20, -10, 0, 10, 20, 30, 40];
  readonly legendGradient = 'linear-gradient(to right, ' + TEMPERATURE_STOPS.map(([t,r,g,b]) => `rgb(${r},${g},${b}) ${(t+20)/60*100}%`).join(', ') + ')';
  private sourceSubscription?: Subscription;
  private textureAbort?: AbortController;
  private boundaryAbort = new AbortController();
  private boundaries?: THREE.LineSegments;
  private generation = 0;

  readonly temperatureLoading = signal(false);

  readonly temperatureError =
    signal<string | null>(null);

  readonly temperatureCount = signal(0);

  readonly overlayOpacity = signal(100);

  // --------------------------------------------------
  // THREE.JS OBJECTS
  // --------------------------------------------------

  private scene!: THREE.Scene;

  private camera!: THREE.PerspectiveCamera;

  private renderer!: THREE.WebGLRenderer;

  private controls!: OrbitControls;

  private earth!: THREE.Mesh;

  private clouds?: THREE.Mesh;

  private locationMarker?: THREE.Group;

  private temperatureOverlay?: THREE.Mesh<
    THREE.SphereGeometry,
    THREE.MeshBasicMaterial
  >;

  private temperatureTexture?: THREE.DataTexture;

  private temperatureSubscription?: Subscription;

  private readonly radius = 2;

  private readonly initialDistance = 6.2;

  private readonly textures: THREE.Texture[] = [];

  private animationFrame = 0;

  private resizeObserver?: ResizeObserver;

  private destroyed = false;

  // --------------------------------------------------
  // LIFECYCLE
  // --------------------------------------------------

  ngAfterViewInit(): void {
    try { this.initializeScene(); }
    catch { this.webglError.set('WebGL is unavailable. Enable hardware acceleration and reload.'); return; }

    this.createStars();

    this.createEarth();

    this.configureControls();

    this.configureResize();

    this.resetView();

    this.animate();
    this.loadSources();
    this.loadTemperatureOverlay();
    this.loadBoundaries();
  }

  // --------------------------------------------------
  // SCENE INITIALIZATION
  // --------------------------------------------------

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

    container.appendChild(
      this.renderer.domElement,
    );

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

  // --------------------------------------------------
  // EARTH
  // --------------------------------------------------

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

    this.earth = new THREE.Mesh(
      geometry,
      material,
    );

    this.scene.add(this.earth);

    const loader = new THREE.TextureLoader();

    // EARTH SURFACE
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

    // SPECULAR MAP
    loader.load(
      '/textures/earth/earth-specular.jpg',
      (texture) => {
        if (this.destroyed) {
          texture.dispose();
          return;
        }

        this.textures.push(texture);

        material.specularMap = texture;

        material.specular = new THREE.Color(
          0x555555,
        );

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

    this.createTemperatureOverlay();
    if (this.clouds) this.clouds.visible = false;
  }

  // --------------------------------------------------
  // CLOUDS
  // --------------------------------------------------

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
      opacity: 0.35,
      depthWrite: false,
    });

    this.clouds = new THREE.Mesh(
      geometry,
      material,
    );

    this.scene.add(this.clouds);

    loader.load(
      '/textures/earth/earth-clouds.png',
      (texture) => {
        if (this.destroyed) {
          texture.dispose();
          return;
        }

        texture.colorSpace =
          THREE.SRGBColorSpace;

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

  // --------------------------------------------------
  // ATMOSPHERE
  // --------------------------------------------------

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
          value: new THREE.Color(
            0x38bdf8,
          ),
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
      new THREE.Mesh(
        geometry,
        material,
      ),
    );
  }

  // --------------------------------------------------
  // TEMPERATURE OVERLAY
  // --------------------------------------------------

  private createTemperatureOverlay(): void {
    const geometry = new THREE.SphereGeometry(
      this.radius * 1.006,
      128,
      96,
    );

    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: this.overlayOpacity() / 100,
      depthWrite: false,
      toneMapped: false,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    });

    this.temperatureOverlay = new THREE.Mesh(
      geometry,
      material,
    );

    this.temperatureOverlay.visible = false;

    this.temperatureOverlay.renderOrder = 2;

    // Attach the overlay to Earth so it stays
    // aligned with geographic coordinates.
    this.earth.add(
      this.temperatureOverlay,
    );
  }

  // --------------------------------------------------
  // STARS
  // --------------------------------------------------

  private createStars(): void {
    const count = 1400;

    const positions = new Float32Array(
      count * 3,
    );

    for (
      let index = 0;
      index < count;
      index++
    ) {
      const theta =
        Math.random() * Math.PI * 2;

      const phi = Math.acos(
        2 * Math.random() - 1,
      );

      const distance =
        25 + Math.random() * 35;

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

    const geometry =
      new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(
        positions,
        3,
      ),
    );

    const material =
      new THREE.PointsMaterial({
        color: 0xb7d9ff,
        size: 0.075,
        transparent: true,
        opacity: 0.85,
        sizeAttenuation: true,
        depthWrite: false,
      });

    this.scene.add(
      new THREE.Points(
        geometry,
        material,
      ),
    );
  }

  // --------------------------------------------------
  // LAYER MANAGEMENT
  // --------------------------------------------------

  setLayer(layer: GlobeLayer): void {
    this.activeLayer.set(layer);
    if (this.clouds) this.clouds.visible = layer === 'surface';
    if (this.boundaries) this.boundaries.visible = layer === 'temperature';
    if (this.temperatureOverlay) this.temperatureOverlay.visible = layer === 'temperature' && !!this.temperatureTexture;
    if (layer === 'temperature' && !this.temperatureTexture && !this.temperatureLoading()) this.loadTemperatureOverlay();
  }

  loadSources(): void {
    this.sourceSubscription?.unsubscribe();
    this.sourceSubscription = this.temperatureService.sources().subscribe({
      next: sources => this.sources.set(sources),
      error: () => this.temperatureError.set('Unable to load archive metadata. Check that FastAPI is running and retry.'),
    });
  }

  changeProvider(provider: ThermalProvider): void {
    const source = this.sources().find(s => s.id === provider && s.available);
    if (!source) return;
    this.provider.set(provider);
    const current = this.temperatureDate();
    if (source.dates && !source.dates.includes(current)) this.temperatureDate.set(source.dates[source.dates.length-1]);
    else if (source.start && current < source.start) this.temperatureDate.set(source.start);
    else if (source.end && current > source.end) this.temperatureDate.set(source.end);
    this.loadTemperatureOverlay();
  }

  changeDate(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    this.temperatureDate.set(date);
    this.loadTemperatureOverlay();
  }

  changeOpacity(value: number): void {
    if (!Number.isFinite(value)) return;
    this.overlayOpacity.set(THREE.MathUtils.clamp(value, 0, 100));
    if (this.temperatureOverlay) this.temperatureOverlay.material.opacity = this.overlayOpacity()/100;
  }

  retry(): void { this.loadSources(); this.loadTemperatureOverlay(); }

  loadTemperatureOverlay(): void {
    if (this.destroyed || this.webglError()) return;
    const generation = ++this.generation;
    this.temperatureSubscription?.unsubscribe();
    this.textureAbort?.abort();
    const abort = new AbortController();
    this.textureAbort = abort;
    this.temperatureLoading.set(true);
    this.temperatureError.set(null);
    this.loadedGrid.set(null);
    this.temperatureCount.set(0);
    if (this.temperatureOverlay) {
      this.temperatureOverlay.visible = false;
      this.temperatureOverlay.material.map = null;
      this.temperatureOverlay.material.needsUpdate = true;
    }
    this.temperatureTexture?.dispose();
    this.temperatureTexture = undefined;
    const date = this.temperatureDate(), provider = this.provider();
    this.temperatureSubscription = this.temperatureService.getTemperatureGrid(date, provider).subscribe({
      next: async response => {
        try {
          if (response.date !== date || response.provider !== provider) throw new Error('Server returned a different date or data source.');
          const texture = await this.createTexture(response, abort.signal);
          if (this.destroyed || generation !== this.generation) { texture.dispose(); return; }
          this.temperatureTexture = texture;
          this.loadedGrid.set(response);
          this.temperatureCount.set(response.valid_cells);
          if (this.temperatureOverlay) {
            this.temperatureOverlay.material.map = texture;
            this.temperatureOverlay.material.needsUpdate = true;
            this.temperatureOverlay.visible = this.activeLayer() === 'temperature';
          }
        } catch (error) {
          if (!abort.signal.aborted && generation === this.generation) this.temperatureError.set(error instanceof Error ? error.message : 'Unable to process global grid.');
        } finally {
          if (generation === this.generation && !this.destroyed) this.temperatureLoading.set(false);
        }
      },
      error: (error: HttpErrorResponse) => {
        if (this.destroyed || generation !== this.generation) return;
        this.temperatureLoading.set(false);
        const detail = error.error?.detail;
        this.temperatureError.set(typeof detail === 'string' ? detail : 'Unable to load this date. Check FastAPI and the archive connection.');
      },
    });
  }

  private async loadBoundaries(): Promise<void> {
    try {
      const response = await fetch('/geography/countries-110m.geojson', {signal: this.boundaryAbort.signal});
      if (!response.ok) throw new Error('Boundary asset unavailable');
      const data = await response.json();
      if (this.destroyed) return;
      this.boundaries = createBoundaries(data, this.radius*1.008);
      this.boundaries.visible = this.activeLayer() === 'temperature';
      this.earth.add(this.boundaries);
    } catch {
      if (!this.destroyed) this.boundaryWarning.set('Country outlines unavailable. Temperature data remain valid.');
    }
  }

  // --------------------------------------------------
  // ORBIT CONTROLS
  // --------------------------------------------------

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

  // --------------------------------------------------
  // LOCATION PICKING
  // --------------------------------------------------

  private readonly handleDoubleClick = (
    event: MouseEvent,
  ): void => {
    const bounds =
      this.renderer.domElement
        .getBoundingClientRect();

    if (
      bounds.width === 0 ||
      bounds.height === 0
    ) {
      return;
    }

    const pointer = new THREE.Vector2(
      (
        (event.clientX - bounds.left) /
        bounds.width
      ) * 2 - 1,
      -(
        (event.clientY - bounds.top) /
        bounds.height
      ) * 2 + 1,
    );

    const raycaster =
      new THREE.Raycaster();

    raycaster.setFromCamera(
      pointer,
      this.camera,
    );

    // Raycast only the Earth surface.
    const intersections =
      raycaster.intersectObject(
        this.earth,
        false,
      );

    if (
      intersections.length === 0
    ) {
      return;
    }

    const intersection =
      intersections[0];

    const localPoint = this.earth
      .worldToLocal(
        intersection.point.clone(),
      )
      .normalize();

    const coordinates = geographicCoordinates(localPoint);
    const latitude = coordinates.latitude;
    const normalizedLongitude = ((coordinates.longitude + 540) % 360) - 180;

    const location: GlobeLocation = {
      latitude: Number(
        latitude.toFixed(4),
      ),
      longitude: Number(
        normalizedLongitude.toFixed(4),
      ),
    };

    this.selectedLocation.set(
      location,
    );

    this.updateLocationMarker(
      localPoint,
    );

    this.locationSelected.emit(
      location,
    );
  };

  // --------------------------------------------------
  // LOCATION MARKER
  // --------------------------------------------------

  private updateLocationMarker(
    localPoint: THREE.Vector3,
  ): void {
    if (!this.locationMarker) {
      this.locationMarker =
        new THREE.Group();

      this.earth.add(
        this.locationMarker,
      );

      const dotGeometry =
        new THREE.SphereGeometry(
          0.035,
          16,
          12,
        );

      const dotMaterial =
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
        });

      const dot = new THREE.Mesh(
        dotGeometry,
        dotMaterial,
      );

      this.locationMarker.add(dot);

      const ringGeometry =
        new THREE.RingGeometry(
          0.055,
          0.085,
          32,
        );

      const ringMaterial =
        new THREE.MeshBasicMaterial({
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

      this.locationMarker.add(ring);
    }

    this.locationMarker.position.copy(
      localPoint
        .clone()
        .multiplyScalar(
          this.radius * 1.045,
        ),
    );

    this.locationMarker.quaternion
      .setFromUnitVectors(
        new THREE.Vector3(
          0,
          0,
          1,
        ),
        localPoint,
      );
  }

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  zoomIn(): void {
    this.setZoom(0.8);
  }

  zoomOut(): void {
    this.setZoom(1.25);
  }

  resetView(): void {
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

    this.earth.rotation.set(
      0,
      -Math.PI / 2,
      0,
    );

    if (this.clouds) {
      this.clouds.rotation.copy(
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

  // --------------------------------------------------
  // RESIZE
  // --------------------------------------------------

  private configureResize(): void {
    const container =
      this.containerRef.nativeElement;

    this.resizeObserver =
      new ResizeObserver(() => {
        const width = Math.max(
          container.clientWidth,
          1,
        );

        const height = Math.max(
          container.clientHeight,
          1,
        );

        this.camera.aspect =
          width / height;

        this.camera.updateProjectionMatrix();

        this.renderer.setSize(
          width,
          height,
        );
      });

    this.resizeObserver.observe(
      container,
    );
  }

  // --------------------------------------------------
  // ANIMATION
  // --------------------------------------------------

  private animate = (): void => {
    if (this.destroyed) {
      return;
    }

    this.animationFrame =
      requestAnimationFrame(
        this.animate,
      );

    this.controls.update();

    if (this.clouds) {
      this.clouds.rotation.y +=
        0.00012;
    }

    this.renderer.render(
      this.scene,
      this.camera,
    );
  };

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  ngOnDestroy(): void {
    this.destroyed = true;

    this.temperatureSubscription?.unsubscribe();
    this.sourceSubscription?.unsubscribe();
    this.textureAbort?.abort();
    this.boundaryAbort.abort();
    this.generation++;

    cancelAnimationFrame(
      this.animationFrame,
    );

    this.resizeObserver?.disconnect();

    this.renderer?.domElement
      .removeEventListener(
        'dblclick',
        this.handleDoubleClick,
      );

    this.controls?.dispose();

    if (this.temperatureOverlay) {
      this.temperatureOverlay.material.map =
        null;
    }

    this.temperatureTexture?.dispose();

    this.scene?.traverse(
      (object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points || object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose();

          const materials =
            Array.isArray(
              object.material,
            )
              ? object.material
              : [object.material];

          for (
            const material of materials
          ) {
            material.dispose();
          }
        }
      },
    );

    for (
      const texture of this.textures
    ) {
      texture.dispose();
    }

    this.renderer?.dispose();

    this.renderer?.domElement.remove();
  }
}
