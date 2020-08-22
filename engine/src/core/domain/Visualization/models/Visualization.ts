import * as THREE from "three";
import TrackballCamera from "../../Camera/interfaces/TrackballCamera";
import { VueConstructor } from "vue/types/umd";
import VisualizationMeta from "./VisualizationMeta";

/**
 * Base class for every visualization.
 * @category VisualizationBase
 */
export default abstract class Visualization {
  /** @internal */
  public parents: Visualization[] = [];

  /** @internal */
  public readonly meta = new VisualizationMeta();

  /**
   * Method called with param containing metadata set from parent visualizations.
   * Parent (or default) metadata can be overwritten here using {@link VisualizationMeta} class
   * @param meta Metadata for GUI and managemant
   */
  public abstract setupOwnMeta(meta: VisualizationMeta): void;

  /**
   * @param scene Root container. Good to set static lights in.
   * @param group Rotating part of scene.
   */
  public abstract setupScene(scene: THREE.Scene, group: THREE.Group): void;

  /**
   * Place to set camera options. For further camera manipulations save `controller` as class prop.
   * @param controller
   */
  public abstract setupCamera(controller: TrackballCamera): void;

  /**
   * Method called every frame to update stuff.
   * @param deltaFactor What part of `1000/60ms` period has elapsed since previous update.
   *                    Should be around `1` with good performance and 60Hz screen.
   */
  public abstract update(deltaFactor: number): void;

  /**
   * Method called when visalization is changed or whole GeoVisCore is destroyed.
   * Good place to remove event listeners to avoid memory leaks.
   */
  public abstract destroy(): void;

  /**
   * Adds parent vis. Target vis may consist of many subvisualizations.
   * @param visualization
   */
  protected addParent(visualization: Visualization) {
    this.parents.push(visualization);
  }

  /**
   * @returns Vue compoment instance or constructor
   */
  public abstract getControls(): Vue | VueConstructor<Vue> | null;

  /** @ignore */
  public _setupMeta(meta = this.meta) {
    this.parents.forEach((p) => p._setupMeta(meta));
    this.setupOwnMeta(meta);
  }

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
