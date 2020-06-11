import * as THREE from "three";
import Visualization from "./domain/Visualization/models/Visualization";
import TrackballController from "./domain/Camera/controllers/TrackballController";

export default class GeoVisCore {
  private readonly container: HTMLElement;
  private visualization?: Visualization;

  private readonly scene: THREE.Scene;
  private group: THREE.Group;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.Renderer;
  private readonly clock: THREE.Clock;

  private cameraController: TrackballController;

  private stopRequested = false;

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
    this.visualization = visualization;
    this.visualization._setup(this.scene, this.group, this.cameraController);
    this._run();
  }

  public stop() {
    this.stopRequested = true;
  }

  //TODO: Handle destroy

  private _run() {
    const deltaFactor = this.clock.getDelta() * 60;
    this.cameraController.update(deltaFactor);

    this.renderer.render(this.scene, this.camera);
    if (this.stopRequested) this.stopRequested = false;
    else requestAnimationFrame(() => this._run());
  }
}
