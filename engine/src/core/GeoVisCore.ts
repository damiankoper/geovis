import * as THREE from "three";
import Visualization from "./domain/visualization/models/Visualization";

export default class GeoVisCore {
  private readonly container: HTMLElement;
  private visualization?: Visualization;

  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.Renderer;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    
    this.camera.position.z = 5;

    this.renderer = new THREE.WebGLRenderer();
    container.appendChild(this.renderer.domElement);
  }

  setSize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix()
  }

  public run(visualization: Visualization) {
    this.scene.dispose();
    this.visualization = visualization;
    this.visualization._setup(this.scene);

    this._run();
  }

  private _run() {
    requestAnimationFrame(() => this._run());
    this.renderer.render(this.scene, this.camera);
  }
}
