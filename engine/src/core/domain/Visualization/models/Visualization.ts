import * as THREE from "three";
import TrackballController from "../../Camera/controllers/TrackballController";
export default abstract class Visualization {
  private parents: Visualization[] = [];

  public _setup(group: THREE.Group, cameraController: TrackballController) {
    this.parents.forEach((p) => {
      p._setup(group, cameraController);
    });
    this.setupCamera(cameraController);
    this.setupScene(group);
  }
  abstract setupScene(group: THREE.Group): void;
  abstract setupCamera(controller: TrackballController): void;

  public _update() {
    this.parents.forEach((p) => p._update());
    this.update();
  }
  abstract update(): void;

  public _destroy() {
    this.parents.forEach((p) => p._destroy());
    this.destroy();
  }
  abstract destroy(): void;

  protected addParent(visualization: Visualization) {
    this.parents.push(visualization);
  }
}
