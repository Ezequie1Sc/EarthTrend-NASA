
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  input,
  output,
} from '@angular/core';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface GlobeLocation {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-earth-globe',
  standalone: true,
  template: `
    <div class="relative h-full min-h-[480px] w-full overflow-hidden">
      <div
        #globeContainer
        class="absolute inset-0"
        aria-label="Interactive three-dimensional Earth"
      ></div>

      <div
        class="pointer-events-none absolute bottom-5 left-5 rounded-xl border border-sky-400/20 bg-slate-950/80 px-4 py-3 text-xs text-slate-300 backdrop-blur-md"
      >
        <p class="font-semibold text-sky-300">Earth Explorer</p>
        <p class="mt-1">Drag to rotate · Scroll to zoom</p>
        <p class="mt-1 text-amber-300">
          Illustrative layer — not measured temperature data
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

  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private globe!: THREE.Mesh;

  private animationFrame = 0;
  private resizeObserver?: ResizeObserver;
  private texture?: THREE.CanvasTexture;

  private readonly radius = 2;

  ngAfterViewInit(): void {
    this.initializeScene();
    this.createGlobe();
    this.configureControls();
    this.configureResize();
    this.animate();
  }

  private initializeScene(): void {
    const container = this.containerRef.nativeElement;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      45,
      Math.max(container.clientWidth, 1) /
        Math.max(container.clientHeight, 1),
      0.1,
      100,
    );

    this.camera.position.set(0, 0, 6.5);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2),
    );

    this.renderer.setSize(
      Math.max(container.clientWidth, 1),
      Math.max(container.clientHeight, 1),
    );

    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambientLight);

    const sunlight = new THREE.DirectionalLight(0xffffff, 2.2);
    sunlight.position.set(5, 3, 5);
    this.scene.add(sunlight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-4, -2, -4);
    this.scene.add(rimLight);
  }

  private createGlobe(): void {
    const geometry = new THREE.SphereGeometry(
      this.radius,
      96,
      64,
    );

    this.texture = this.createIllustrativeTexture();

    const material = new THREE.MeshPhongMaterial({
      map: this.texture,
      shininess: 18,
    });

    this.globe = new THREE.Mesh(geometry, material);

    this.scene.add(this.globe);

    const atmosphereGeometry = new THREE.SphereGeometry(
      this.radius * 1.025,
      64,
      48,
    );

    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.075,
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.scene.add(
      new THREE.Mesh(
        atmosphereGeometry,
        atmosphereMaterial,
      ),
    );
  }

  private createIllustrativeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');

    canvas.width = 1024;
    canvas.height = 512;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Unable to create globe texture.');
    }

    const gradient = context.createLinearGradient(
      0,
      0,
      0,
      canvas.height,
    );

    gradient.addColorStop(0, '#1039d7');
    gradient.addColorStop(0.14, '#00c8f8');
    gradient.addColorStop(0.27, '#6de947');
    gradient.addColorStop(0.39, '#ffe83c');
    gradient.addColorStop(0.5, '#f54b17');
    gradient.addColorStop(0.61, '#ffe83c');
    gradient.addColorStop(0.73, '#6de947');
    gradient.addColorStop(0.86, '#00c8f8');
    gradient.addColorStop(1, '#1039d7');

    context.fillStyle = gradient;
    context.fillRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    // Graticule: geographical reference only.
    context.strokeStyle = 'rgba(0, 20, 50, 0.20)';
    context.lineWidth = 1;

    for (let longitude = 0; longitude <= 360; longitude += 30) {
      const x = (longitude / 360) * canvas.width;

      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, canvas.height);
      context.stroke();
    }

    for (let latitude = -60; latitude <= 60; latitude += 30) {
      const y = ((90 - latitude) / 180) * canvas.height;

      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(canvas.width, y);
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);

    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
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
    this.controls.maxDistance = 12;

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
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );

    const raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(pointer, this.camera);

    const intersections = raycaster.intersectObject(
      this.globe,
    );

    if (!intersections.length) {
      return;
    }

    const point = intersections[0].point.clone();

    this.globe.worldToLocal(point);
    point.normalize();

    const latitude =
      THREE.MathUtils.radToDeg(Math.asin(point.y));

    const longitude =
      THREE.MathUtils.radToDeg(
        Math.atan2(point.z, -point.x),
      );

    this.locationSelected.emit({
      latitude: Number(latitude.toFixed(4)),
      longitude: Number(longitude.toFixed(4)),
    });
  };

  private configureResize(): void {
    const container = this.containerRef.nativeElement;

    this.resizeObserver = new ResizeObserver(() => {
      const width = Math.max(container.clientWidth, 1);
      const height = Math.max(container.clientHeight, 1);

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    });

    this.resizeObserver.observe(container);
  }

  private animate = (): void => {
    this.animationFrame = requestAnimationFrame(
      this.animate,
    );

    this.controls.update();

    this.renderer.render(
      this.scene,
      this.camera,
    );
  };

  zoomIn(): void {
    this.setZoom(0.8);
  }

  zoomOut(): void {
    this.setZoom(1.25);
  }

  resetView(): void {
    this.camera.position.set(0, 0, 6.5);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  private setZoom(factor: number): void {
    const distance = this.camera.position.length();

    const nextDistance = THREE.MathUtils.clamp(
      distance * factor,
      this.controls.minDistance,
      this.controls.maxDistance,
    );

    this.camera.position.setLength(nextDistance);
    this.controls.update();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.animationFrame);

    this.resizeObserver?.disconnect();

    this.renderer?.domElement.removeEventListener(
      'dblclick',
      this.handleDoubleClick,
    );

    this.controls?.dispose();

    this.scene?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();

        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];

        for (const material of materials) {
          material.dispose();
        }
      }
    });

    this.texture?.dispose();

    this.renderer?.dispose();

    this.renderer?.domElement.remove();
  }
}
