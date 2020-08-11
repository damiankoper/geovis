import * as THREE from "three";
import TrackballCamera from "../../../../../core/domain/Camera/interfaces/TrackballCamera";
import Visualization from "../../../../../core/domain/Visualization/models/Visualization";
import VisualizationMeta from "../../../../../core/domain/Visualization/models/VisualizationMeta";
import { VueConstructor } from "vue/types/umd";

/**
 * Example of empty visualization
 * @category VisualizationExamples
 */
export default class EmptyVis extends Visualization {
  constructor() {
    super();
    Object.seal(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setupCamera(camera: TrackballCamera): void {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(deltaFactor: number): void {
    //
  }

  destroy(): void {
    //
  }

  getControls(): Vue | VueConstructor<Vue> | null {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setupOwnMeta(meta: VisualizationMeta): void {
    //
  }
}
