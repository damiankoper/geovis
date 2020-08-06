import Visualization from "../../models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Vue from "vue";
import starsMap from "@/assets/textures/4k_stars.jpg";
import TimeService from "../EarthVis/TimeService";
import VisualizationMeta from "../../models/VisualizationMeta";

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
    super();
    Object.seal(this);
  }

  setupCamera(camera: TrackballCamera): void {
    ///
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    this.mesh.renderOrder = 0;
    group.add(this.mesh);
  }

  update(deltaFactor: number): void {
    this.mesh.rotation.y = TimeService.getHourAngle();
  }

  destroy(): void {
    console.log("distroyed 2");
    this.stars.dispose();
    this.starsMaterial.map?.dispose();
    this.starsMaterial.dispose();
  }

  getControls() {
    return null;
  }

  setupMeta(meta: VisualizationMeta) {
    meta.setTitle("Stars");
    meta.setAuthor("Damian Koper");
    meta.setDescription(
      'Can act as "not so cool" visualization on its own but its true purpose is to be background for other visualizations.'
    );
    meta.setKeywords(["stars", "milkyway"]);
  }
}
