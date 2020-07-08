import Visualization from "../../models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Vue from "vue";
import starsMap from "@/assets/textures/4k_stars.jpg";

/**
 * @category VisualizationExamples
 */
export default class StarsVis extends Visualization {
  setupCamera(camera: TrackballCamera): void {
    ///
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    const sphere = new THREE.SphereGeometry(40000, 10, 10);
    const sphereMaterial = new THREE.MeshBasicMaterial();
    sphereMaterial.side = THREE.BackSide;
    sphereMaterial.map = new THREE.TextureLoader().load(starsMap);
    const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);

    sphereMesh.matrixAutoUpdate = false;
    group.add(sphereMesh);
  }

  update(deltaFactor: number): void {
    //
  }

  destroy(): void {
    //
  }

  getControls() {
    return new Vue();
  }
}
