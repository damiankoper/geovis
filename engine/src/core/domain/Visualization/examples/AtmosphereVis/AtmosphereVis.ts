import Visualization from "../../models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Vue from "vue";
import vertexShader from "./atm.vs";
import fragmentShader from "./atm.fs";
import { Vector3, MeshBasicMaterial, Quaternion } from "three";

/**
 * @category VisualizationExamples
 */
export default class AtmosphereVis extends Visualization {
  private camera?: TrackballCamera;
  private atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      c: { value: 1 },
      p: { value: 3 },
      glowColor: { value: new THREE.Color(0xbbbbff) },
      viewVector: { value: new Vector3(0, 0, 1) },
    },
    blending: THREE.AdditiveBlending,
    transparent: true,
    side: THREE.BackSide,
  });

  constructor(
    private readonly surfaceRadius: number = 6371,
    private readonly thickness: number = 480
  ) {
    super();
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      .setGlobalOrbitRadius(this.surfaceRadius)
      .setLocalOrbitRadius(this.surfaceRadius + this.thickness);
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    const sphere = new THREE.SphereGeometry(
      this.surfaceRadius + this.thickness,
      100,
      100
    );
    const sphereMesh = new THREE.Mesh(sphere, this.atmosphereMaterial);
    sphereMesh.translateZ(-this.surfaceRadius);
    scene.add(sphereMesh);

    /*     const sphere2 = new THREE.SphereGeometry(this.surfaceRadius, 100, 100);
    const sphereMeshMaterial = new MeshBasicMaterial({
      color: 0xbada55,
    });
    const sphereMesh2 = new THREE.Mesh(sphere2, sphereMeshMaterial);
    group.add(sphereMesh2); */
  }

  update(deltaFactor: number): void {
    const globalOrbit = this.camera?.getGlobalOrbit();
    const localOrbit = this.camera?.getLocalOrbit();
    if (globalOrbit && localOrbit) {
      this.atmosphereMaterial.uniforms.viewVector.value = new Vector3()
        .addVectors(localOrbit.v, new Vector3(0, 0, this.surfaceRadius))
        .normalize();
    }
  }

  destroy(): void {
    //
  }

  getControls() {
    return new Vue();
  }
}
