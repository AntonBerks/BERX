import * as THREE from 'three';
import type { Berx5DFrame } from '@berx/spatial';

/**
 * Real 3D web renderer for BERX MAX. This is deliberately independent from
 * the existing 2D design-system adapter: world objects become actual meshes,
 * the camera is a PerspectiveCamera, depth is GPU depth, and lighting is real.
 */
export class BerxThreeRuntimeRenderer {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly renderer: THREE.WebGLRenderer;
  private readonly meshes = new Map<string, THREE.Mesh>();
  private readonly root = new THREE.Group();

  constructor(canvas: HTMLCanvasElement, options: { alpha?: boolean } = {}) {
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.01, 500);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: options.alpha ?? false,
      depth: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.scene.background = new THREE.Color('#07080A');
    this.scene.add(this.root);

    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(4, 6, 8);
    this.scene.add(key);

    const rim = new THREE.PointLight(0x4fd6e8, 18, 30, 2);
    rim.position.set(-5, 1, 4);
    this.scene.add(rim);

    const fill = new THREE.PointLight(0xc9b58a, 10, 24, 2);
    fill.position.set(5, -3, 2);
    this.scene.add(fill);
  }

  resize(width: number, height: number): void {
    this.camera.aspect = Math.max(0.01, width / Math.max(1, height));
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  sync(frame: Berx5DFrame): void {
    const live = new Set(frame.world.objects.map((object) => object.id));

    for (const object of frame.world.objects) {
      let mesh = this.meshes.get(object.id);
      if (!mesh) {
        const geometry = new THREE.BoxGeometry(1.9, 1.25, 0.08, 2, 2, 1);
        const material = new THREE.MeshPhysicalMaterial({
          color: object.kind === 'person' ? 0xf2f0eb : 0x15191e,
          metalness: object.kind === 'person' ? 0.05 : 0.68,
          roughness: object.kind === 'person' ? 0.62 : 0.28,
          transmission: object.kind === 'person' ? 0.02 : 0.22,
          transparent: object.material.opacity < 0.999,
          opacity: object.material.opacity,
          emissive: 0x071115,
          emissiveIntensity: object.energy * 0.35,
        });
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.meshes.set(object.id, mesh);
        this.root.add(mesh);
      }

      mesh.position.set(object.transform.position.x, object.transform.position.y, object.transform.position.z);
      mesh.rotation.set(object.transform.rotation.x, object.transform.rotation.y, object.transform.rotation.z);
      mesh.scale.set(object.transform.scale.x, object.transform.scale.y, object.transform.scale.z);
      mesh.visible = object.visible;
      mesh.userData.berxObjectId = object.id;
    }

    for (const [id, mesh] of this.meshes) {
      if (!live.has(id)) {
        this.root.remove(mesh);
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
        else mesh.material.dispose();
        this.meshes.delete(id);
      }
    }

    const c = frame.camera;
    this.camera.position.set(c.position.x, c.position.y, c.position.z);
    this.camera.rotation.set(c.rotation.x, c.rotation.y, c.rotation.z);
    this.camera.lookAt(c.target.x, c.target.y, c.target.z);
    this.camera.fov = c.fov;
    this.camera.near = c.near;
    this.camera.far = c.far;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    for (const mesh of this.meshes.values()) {
      mesh.geometry.dispose();
      if (Array.isArray(mesh.material)) mesh.material.forEach((m) => m.dispose());
      else mesh.material.dispose();
    }
    this.meshes.clear();
    this.renderer.dispose();
  }
}
