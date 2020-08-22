import * as THREE from "three";
import Visualization from "./domain/Visualization/models/Visualization";
import TrackballController from "./domain/Camera/controllers/TrackballController";
import TWEEN from "@tweenjs/tween.js";

export default class GeoVisCore {
  private readonly container: HTMLElement;
  private visualization: Visualization | null = null;

  private scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.Renderer;
  private readonly clock: THREE.Clock;
  public readonly cameraController: TrackballController;

  private destroyRequested = false;

  /**
   * @param container Container which Canvas element will be appended to
   */
  constructor(container: HTMLElement) {
    this.container = container;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(60, 1, 0.001, 70000);
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({
      logarithmicDepthBuffer: true,
      antialias: true,
    });
    container.appendChild(this.renderer.domElement);
    this.setSize();

    this.cameraController = new TrackballController(
      this.camera,
      this.renderer.domElement
    );

    // Do not allow Vue to set reactivity here and deeper
    Object.seal(this);
  }

  /**
   * Needs to be called on `container` size change.
   * Should be typically called by event handler.
   */
  public setSize() {
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Setup and run visualization. Previous one will have it's destroy chain called.
   * @param visualization Visualization to be run
   */
  public run(visualization: Visualization) {
    if (this.visualization) {
      this.visualization._destroy();
    }

    while (this.scene.children.length) {
      this.scene.remove(this.scene.children[0]);
    }
    this.scene.dispose();

    const group = new THREE.Group();
    this.scene = new THREE.Scene();
    this.scene.add(group);
    this.cameraController.setGroup(group);

    this.visualization = visualization;
    this.visualization._setup(this.scene, group, this.cameraController);

    this._run();
  }

  /**
   * Destroy while GeoVisCore object. It visualization is set up it's destroy chain would be called.
   */
  public destroy() {
    this.destroyRequested = true;
    if (this.visualization) {
      this.visualization._destroy();
    }
    this.cameraController.destroy();
    this.scene.dispose();
  }

  private _run() {
    if (this.destroyRequested) this.destroyRequested = false;
    else requestAnimationFrame(() => this._run());

    const deltaS = this.clock.getDelta();
    const deltaFactor = deltaS * 60; // Target -> 60 FPS

    this.cameraController.update();
    this.visualization?._update(deltaFactor);
    TWEEN.update(TWEEN.now());

    this.renderer.render(this.scene, this.camera);
  }
}
