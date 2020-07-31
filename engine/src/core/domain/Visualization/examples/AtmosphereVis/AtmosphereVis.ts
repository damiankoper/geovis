import Visualization from "../../models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Vue from "vue";
import vertexShader from "./atm.vs";
import vertexGroundShader from "./atmGround.vs";
import fragmentShader from "./atm.fs";
import fragmentGroundShader from "./atmGround.fs";
import { Vector3, MeshBasicMaterial, Quaternion } from "three";
import * as d3 from "d3-ease";
/**
 * @category VisualizationExamples
 */
export default class AtmosphereVis extends Visualization {
  private camera?: TrackballCamera;
  public atmosphereMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      start: { value: 1 },
      stop: { value: 0.6 },
      fadeOut: { value: 0 },
      light: { value: 0 },
      power: { value: 1.25 },
      glowColor: { value: new THREE.Color(0x87ceeb) },
      viewVector: { value: new Vector3(0, 0, 1) },
      ...THREE.UniformsLib.lights,
    },
    depthFunc: THREE.NeverDepth,
    lights: true,
    transparent: true,
    side: THREE.BackSide,
  });

  public atmosphereGroundMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexGroundShader,
    fragmentShader: fragmentGroundShader,
    uniforms: {
      start: { value: 1 },
      stop: { value: 0.6 },
      fadeOut: { value: 0 },
      light: { value: 0 },
      power: { value: 1 },
      glowColor: { value: new THREE.Color(0x87ceeb) },
      viewVector: { value: new Vector3(0, 0, 1) },
      ...THREE.UniformsLib.lights,
    },
    depthFunc: THREE.AlwaysDepth,
    lights: true,
    transparent: true,
    side: THREE.FrontSide,
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
      300,
      300
    );
    const sphereMesh = new THREE.Mesh(sphere, this.atmosphereMaterial);
    sphereMesh.translateZ(-this.surfaceRadius);
    scene.add(sphereMesh);

    const sphereGround = new THREE.SphereGeometry(this.surfaceRadius, 300, 300);
    const sphereMeshGround = new THREE.Mesh(
      sphereGround,
      this.atmosphereGroundMaterial
    );
    sphereMeshGround.translateZ(-this.surfaceRadius);
    scene.add(sphereMeshGround);
  }

  update(deltaFactor: number): void {
    const globalOrbit = this.camera?.getGlobalOrbit();
    const localOrbit = this.camera?.getLocalOrbit();
    if (globalOrbit && localOrbit) {
      const camFromCenter = new Vector3().addVectors(
        localOrbit.v,
        new Vector3(0, 0, this.surfaceRadius)
      );
      const camFromCenterNormalized = camFromCenter.clone().normalize();
      this.atmosphereMaterial.uniforms.viewVector.value = camFromCenterNormalized;
      this.atmosphereGroundMaterial.uniforms.viewVector.value = camFromCenterNormalized;

      const beta = Math.acos(this.surfaceRadius / camFromCenter.length());
      const delta = Math.acos(
        this.surfaceRadius / (this.surfaceRadius + this.thickness)
      );

      const gamma = Math.acos(
        this.surfaceRadius / (this.surfaceRadius + this.thickness)
      );

      const alpha =
        Math.acos(
          (this.surfaceRadius + this.thickness) / camFromCenter.length()
        ) || 0;
      const stop = (beta + delta) / Math.PI;
      let fadeOut = (beta + delta - alpha) / Math.PI;

      const underAtmFrac =
        1 -
        Math.min(camFromCenter.length() - this.surfaceRadius, this.thickness) /
          this.thickness;

      if (alpha === 0) {
        fadeOut += 30 * stop * d3.easeExpIn(underAtmFrac);
      }

      this.atmosphereMaterial.uniforms.stop.value = stop;
      this.atmosphereMaterial.uniforms.fadeOut.value = fadeOut;
      this.atmosphereMaterial.uniforms.light.value = gamma / Math.PI;
      this.atmosphereGroundMaterial.uniforms.stop.value = beta / Math.PI;
      this.atmosphereGroundMaterial.uniforms.fadeOut.value = 1 - underAtmFrac;
      this.atmosphereGroundMaterial.uniforms.light.value = gamma / Math.PI;
    }
  }

  destroy(): void {
    //
  }

  getControls() {
    return new Vue();
  }
}
