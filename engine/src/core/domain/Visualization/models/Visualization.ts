import * as THREE from "three";
import TrackballController from "../../Camera/controllers/TrackballController";
export default abstract class Visualization {
  private parents: Visualization[] = [];

  public _setup(scene: THREE.Scene, cameraController: TrackballController) {
    this.parents.forEach(p => {
      p._setup(scene, cameraController);
    });
    this.setupCamera(cameraController);
    this.setupScene(scene);
  }
  abstract setupScene(scene: THREE.Scene): void;
  abstract setupCamera(controller: TrackballController): void;

  public _update() {
    this.parents.forEach(p => p._update());
    this.update();
  }
  abstract update(): void;

  public _destroy() {
    this.parents.forEach(p => p._destroy());
    this.destroy();
  }
  abstract destroy(): void;

  protected addParent(visualization: Visualization) {
    this.parents.push(visualization);
  }
}
