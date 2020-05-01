import * as THREE from "three";
import Visualization from "./domain/Visualization/models/Visualization";
import TrackballController from "./domain/Camera/controllers/TrackballController";

export default class GeoVisCore {
  private readonly container: HTMLElement;
  private visualization?: Visualization;

  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.Renderer;

  private cameraController: TrackballController;

  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.01, 10000);

    this.renderer = new THREE.WebGLRenderer({
      logarithmicDepthBuffer: true,
      antialias: true
    });
    container.appendChild(this.renderer.domElement);

    this.cameraController = new TrackballController(
      this.camera,
      this.renderer.domElement
    );
  }

  setSize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  public run(visualization: Visualization) {
    this.scene.dispose();
    this.visualization = visualization;
    this.visualization._setup(this.scene, this.cameraController);

    this._run();
  }

  private _run() {
    requestAnimationFrame(() => this._run());
    this.cameraController.update();
    this.renderer.render(this.scene, this.camera);
  }
}
