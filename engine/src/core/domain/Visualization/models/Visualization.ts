import * as THREE from "three";
import TrackballCamera from "../../Camera/interfaces/TrackballCamera";

/**
 * Base class for every visualization.
 * @category VisualizationBase
 */
export default abstract class Visualization {
  private parents: Visualization[] = [];

  /**
   * @param scene Root container. Good to set static lights in.
   * @param group Rotating part of scene.
   */
  abstract setupScene(scene: THREE.Scene, group: THREE.Group): void;

  /**
   * Place to set camera options. For further camera manipulations save `controller` as class prop.
   * @param controller
   */
  abstract setupCamera(controller: TrackballCamera): void;

  /**
   * Method called every frame to update stuff.
   * @param deltaFactor What part of `1000/60ms` period has elapsed since previous update.
   *                    Should be around `1` when good performance.
   */
  abstract update(deltaFactor: number): void;

  /**
   * Method called when visualizartion is changed or whole GeoVisCore is destroyed.
   * Good place to remove event listeners to avoid memory leaks.
   */
  abstract destroy(): void;

  /**
   * Adds parent vis. Target vis may consist of many subvisualizations.
   * @param visualization
   */
  protected addParent(visualization: Visualization) {
    this.parents.push(visualization);
  }

  abstract getControls(): Vue | null;

  /** @ignore */
  public _setup(
    scene: THREE.Scene,
    group: THREE.Group,
    cameraController: TrackballCamera
  ) {
    this.parents.forEach((p) => {
      p._setup(scene, group, cameraController);
    });
    this.setupCamera(cameraController);
    this.setupScene(scene, group);
  }

  /** @ignore */
  public _update(deltaFactor: number) {
    this.parents.forEach((p) => p._update(deltaFactor));
    this.update(deltaFactor);
  }

  /** @ignore */
  public _destroy() {
    this.parents.forEach((p) => p._destroy());
    this.destroy();
  }
}
