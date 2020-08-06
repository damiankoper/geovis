import Visualization from "../../models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Vue from "vue";
import vertexShader from "./atm.vs";
import vertexGroundShader from "./atmGround.vs";
import fragmentShader from "./atm.fs";
import fragmentGroundShader from "./atmGround.fs";
import * as d3 from "d3-ease";
/**
 * @category VisualizationExamples
 */
export default class AtmosphereVis extends Visualization {
  private camera: TrackballCamera | null = null;
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
      viewVector: { value: new THREE.Vector3() },
      ...THREE.UniformsLib.lights,
    },
    depthFunc: THREE.NeverDepth,
    lights: true,
    transparent: true,
    side: THREE.BackSide,
    depthWrite: false,
  });

  public atmosphereGroundMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexGroundShader,
    fragmentShader: fragmentGroundShader,
    uniforms: {
      stop: { value: 0.6 },
      fadeOut: { value: 0 },
      power: { value: 1 },
      glowColor: { value: new THREE.Color(0x87ceeb) },
      viewVector: { value: new THREE.Vector3() },
      ...THREE.UniformsLib.lights,
    },
    lights: true,
    side: THREE.FrontSide,
    transparent: false,
    blending: THREE.AdditiveBlending,
    depthFunc: THREE.AlwaysDepth,
  });

  private atmoSphere: THREE.SphereBufferGeometry;
  private atmoSphereGround: THREE.SphereBufferGeometry;
  constructor(
    private G: number = 6371,
    private T: number = 480,
    private groundRenderOrder = 50,
    private GT = G + T
  ) {
    super();
    this.atmoSphere = new THREE.SphereBufferGeometry(GT, 200, 100);
    this.atmoSphereGround = new THREE.SphereBufferGeometry(G, 200, 100);
    Object.seal(this);
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera.setGlobalOrbitRadius(this.G).setLocalOrbitRadius(this.GT);
  }
  private group: THREE.Group | null = null;
  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    this.group = group;
    const sphereMesh = new THREE.Mesh(this.atmoSphere, this.atmosphereMaterial);
    sphereMesh.renderOrder = 0;
    group.add(sphereMesh);

    const sphereMeshGround = new THREE.Mesh(
      this.atmoSphereGround,
      this.atmosphereGroundMaterial
    );
    sphereMeshGround.renderOrder = this.groundRenderOrder;
    group.add(sphereMeshGround);
  }

  update(deltaFactor: number): void {
    const globalOrbit = this.camera?.getGlobalOrbit();
    const localOrbit = this.camera?.getLocalOrbit();
    if (globalOrbit && localOrbit && this.group) {
      const q = new THREE.Quaternion()
        .setFromRotationMatrix(this.group.matrix)
        .conjugate();
      const GL = new THREE.Vector3(0, 0, this.G)
        .applyQuaternion(q)
        .add(localOrbit.v.clone().applyQuaternion(q));

      const GLNormalized = GL.clone().normalize();
      this.atmosphereMaterial.uniforms.viewVector.value = GLNormalized;
      this.atmosphereGroundMaterial.uniforms.viewVector.value = GLNormalized;
      const GLLength = GL.length();

      const alpha = Math.acos(this.GT / GLLength) || 0;
      const beta = Math.acos(this.G / GLLength);
      const gamma = Math.acos(this.G / this.GT);

      const underAtmFrac = 1 - Math.min(GLLength - this.G, this.T) / this.T;

      let fadeOut = (beta + gamma - alpha) / Math.PI;
      const stop = (beta + gamma) / Math.PI;
      if (alpha === 0) {
        fadeOut += 30 * stop * d3.easeExpIn(underAtmFrac);
      }

      this.atmosphereMaterial.uniforms.stop.value = stop;
      this.atmosphereMaterial.uniforms.fadeOut.value = fadeOut;
      this.atmosphereMaterial.uniforms.light.value = gamma / Math.PI;

      this.atmosphereGroundMaterial.uniforms.stop.value = beta / Math.PI;
      this.atmosphereGroundMaterial.uniforms.fadeOut.value = 1 - underAtmFrac;
    }
  }

  destroy(): void {
    console.log("distroyed 3");
    this.atmoSphereGround.dispose();
    this.atmoSphere.dispose();
    this.atmosphereMaterial.dispose();
    this.atmosphereGroundMaterial.dispose();
  }

  getControls() {
    return new Vue();
  }
}
