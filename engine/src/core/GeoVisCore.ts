import * as THREE from "three";
import Visualization from "./domain/Visualization/models/Visualization";
import TrackballController from "./domain/Camera/controllers/TrackballController";

export default class GeoVisCore {
  private readonly container: HTMLElement;
  private visualization?: Visualization;

  private readonly scene: THREE.Scene;
  private readonly group: THREE.Group;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.Renderer;
  private readonly clock: THREE.Clock;
  public readonly cameraController: TrackballController;

  private destroyRequested = false;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.001, 50000);
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      logarithmicDepthBuffer: true,
      antialias: true,
    });
    container.appendChild(this.renderer.domElement);

    this.cameraController = new TrackballController(
      this.camera,
      this.group,
      this.renderer.domElement
    );

    // Do not allow Vue to set reactivity here and deeper
    Object.getOwnPropertyNames(this).forEach((prop) => {
      Object.defineProperty(this, prop, { configurable: false });
    });
  }

  public setSize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public run(visualization: Visualization) {
    this.scene.dispose();
    if (this.visualization) this.visualization.destroy();

    this.visualization = visualization;
    this.visualization._setup(this.scene, this.group, this.cameraController);
    this._run();
  }

  public destroy() {
    this.destroyRequested = true;
    this.cameraController.destroy();
  }

  private _run() {
    const deltaFactor = this.clock.getDelta() * 60;
    this.cameraController.update(deltaFactor);
    this.visualization?.update(deltaFactor);

    this.renderer.render(this.scene, this.camera);
    if (this.destroyRequested) this.destroyRequested = false;
    else requestAnimationFrame(() => this._run());
  }
}
