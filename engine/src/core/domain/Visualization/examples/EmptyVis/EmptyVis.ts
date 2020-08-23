import { VueConstructor } from "vue/types/umd";
import * as THREE from "three";
import TrackballCamera from "../../../../../core/domain/Camera/interfaces/TrackballCamera";
import Visualization from "../../../../../core/domain/Visualization/models/Visualization";
import VisualizationMeta from "../../../../../core/domain/Visualization/models/VisualizationMeta";

/**
 * Example of empty visualization
 * @category VisualizationExamples
 */
export default class EmptyVis extends Visualization {
  constructor() {
    super("emptyVis");
    Object.seal(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setupCamera(camera: TrackballCamera): void {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setupScene(scene: THREE.Scene, group: THREE.Group): void {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(deltaFactor: number): void {
    //
  }

  public destroy(): void {
    //
  }

  public getControls(): Vue | VueConstructor<Vue> | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setupOwnMeta(meta: VisualizationMeta): void {
    //
  }
}
