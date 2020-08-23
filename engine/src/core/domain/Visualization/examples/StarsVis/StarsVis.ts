import * as THREE from "three";
import TrackballCamera from "../../../../../core/domain/Camera/interfaces/TrackballCamera";
import Visualization from "../../../../../core/domain/Visualization/models/Visualization";
import VisualizationMeta from "../../../../../core/domain/Visualization/models/VisualizationMeta";
import TimeService from "../../../../../core/domain/Visualization/examples/EarthVis/TimeService";
import starsMap from "../../../../../core/domain/Visualization/examples/StarsVis/assets/textures/4k_stars.jpg";

import thumbnail from "!!base64-image-loader!./assets/thumbnail.jpg";

/**
 * @category VisualizationExamples
 */
export default class StarsVis extends Visualization {
  private stars = new THREE.SphereGeometry(40000, 10, 10);
  private starsMaterial = new THREE.MeshBasicMaterial({
    side: THREE.BackSide,
    map: new THREE.TextureLoader().load(starsMap),
    depthWrite: false,
    depthFunc: THREE.NeverDepth,
  });
  private mesh = new THREE.Mesh(this.stars, this.starsMaterial);

  constructor() {
    super("starsVis");
    Object.seal(this);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setupCamera(camera: TrackballCamera): void {
    //
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public setupScene(scene: THREE.Scene, group: THREE.Group): void {
    this.mesh.renderOrder = 0;
    group.add(this.mesh);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(deltaFactor: number): void {
    this.mesh.rotation.y = TimeService.getHourAngle();
  }

  public destroy(): void {
    this.stars.dispose();
    this.starsMaterial.map?.dispose();
    this.starsMaterial.dispose();
  }

  public getControls() {
    return null;
  }

  public setupOwnMeta(meta: VisualizationMeta) {
    meta.setTitle("Stars");
    meta.setAuthor("Damian Koper");
    meta.setDescription(
      'Can act as "not so cool" visualization on its own but its true purpose is to be background for other visualizations.'
    );
    meta.addKeywords(["stars", "milkyway"]);
    meta.setThumbnail(thumbnail);
  }
}
