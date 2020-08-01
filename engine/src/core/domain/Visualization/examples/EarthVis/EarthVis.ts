import Visualization from "@/core/domain/Visualization/models/Visualization";
import * as THREE from "three";
import TrackballCamera from "@/core/domain/Camera/interfaces/TrackballCamera";
import Range from "@/core/domain/GeoPosition/models/Range";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import earthMap from "@/assets/textures/8k_earth_daymap.jpg";
import earthNightMap from "@/assets/textures/8k_earth_nightmap.jpg";
import earthNormalMap from "@/assets/textures/8k_earth_normal_map.jpg";
import earthSpecularMap from "@/assets/textures/8k_earth_specular_map.jpg";
import earthCloudsMap from "@/assets/textures/8k_earth_clouds.jpg";
import StarsVis from "@/core/domain/Visualization/examples/StarsVis/StarsVis";
import EarthVisControls from "./EarthVisControls.vue";
import AtmosphereVis from "../AtmosphereVis/AtmosphereVis";
import { Vector3, Mesh } from "three";
import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
import moment from "moment";
/**
 * @category VisualizationExamples
 */
export default class EarthVis extends Visualization {
  readonly r = 6371;
  camera: TrackballCamera | null = null;
  mesh: Mesh | null = null;
  cloudMesh: Mesh | null = null;
  private nightMap: THREE.Texture = new THREE.TextureLoader().load(
    earthNightMap
  );
  private sphere = new THREE.SphereGeometry(this.r, 100, 100).rotateY(
    -Math.PI / 2
  );
  private sphereMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(earthMap),
    specularMap: new THREE.TextureLoader().load(earthSpecularMap),
    normalMap: new THREE.TextureLoader().load(earthNormalMap),
    shininess: 100,
  });
  private sphereClouds = new THREE.SphereGeometry(this.r + 4, 100, 100).rotateY(
    -Math.PI / 2
  );
  private sphereCloudsMaterial = new THREE.MeshPhongMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    map: new THREE.TextureLoader().load(earthCloudsMap),
  });
  private directionalLight = new THREE.DirectionalLight(0xffffff, 1);

  constructor() {
    super();
    this.addParent(new StarsVis());
    this.addParent(new AtmosphereVis());
    this.sphereMaterial.onBeforeCompile = this.modifyShader.bind(this);
    Object.seal(this);
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      .setMode(TrackballMode.Compass)
      .setZoomBounds(new Range(200, 20000))
      .setGlobalOrbitBounds(
        new Range(GeoPosition.fromDeg(-85, -180), GeoPosition.fromDeg(85, 180))
      );
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    this.mesh = new THREE.Mesh(this.sphere, this.sphereMaterial);
    this.mesh.renderOrder = 11;
    group.add(this.mesh);

    this.cloudMesh = new THREE.Mesh(
      this.sphereClouds,
      this.sphereCloudsMaterial
    );
    this.cloudMesh.renderOrder = 10;
    group.add(this.cloudMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
    scene.add(ambientLight);

    group.add(this.directionalLight);
    group.add(this.directionalLight.target);
  }

  update(deltaFactor: number): void {
    this.directionalLight.position
      .set(0, 0, 10000)
      .applyAxisAngle(new Vector3(1, 0, 0), this.getSunDeclination())
      .applyAxisAngle(new Vector3(0, -1, 0), this.getHourAngle());
  }

  destroy(): void {
    console.log("distroyed 1");

    this.sphereMaterial.map?.dispose();
    this.sphereMaterial.specularMap?.dispose();
    this.sphereMaterial.normalMap?.dispose();
    this.sphereMaterial.dispose();
    this.sphere.dispose();
    this.sphereCloudsMaterial.map?.dispose();
    this.sphereCloudsMaterial.dispose();
    this.sphereClouds.dispose();
    this.nightMap.dispose();
  }

  getControls() {
    return EarthVisControls;
  }

  // Source: http://mypages.iit.edu/~maslanka/SolarGeo.pdf
  getSunDeclination() {
    return Math.asin(
      0.39795 * Math.cos(0.08563 * (moment().dayOfYear() - 173))
    );
  }

  // Source: https://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-time
  getHourAngle(fromTimezone = 0, longitude = 0) {
    const LSTM = 15 * fromTimezone;
    const timeLong = longitude;
    const B = (360 / 365) * (moment().dayOfYear() - 81);
    const EOT = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    const TC = 4 * (timeLong - LSTM) + EOT;
    const LST =
      moment.utc().diff(moment.utc().startOf("day"), "minutes") / 60 + TC / 60;
    const HRA = 15 * (LST - 12);
    return THREE.MathUtils.degToRad(HRA);
  }

  modifyShader(shader: THREE.Shader) {
    shader.uniforms.nightMap = {
      value: this.nightMap,
    };
    shader.fragmentShader =
      `
      float easeInOutExpo(float x) {
        return x == 0.
          ? 0.
          : x == 1.
          ? 1.
          : x < 0.5 ? pow(2., 20. * x - 10.) / 2.
          : (2. - pow(2., -20. * x + 10.)) / 2.;
        }
      uniform sampler2D nightMap;
    ` + shader.fragmentShader;

    const toInsertAfter = `vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;`;
    shader.fragmentShader = shader.fragmentShader.replace(
      toInsertAfter,
      `
      ${toInsertAfter}
      #if NUM_DIR_LIGHTS > 0
          float dotL =  dot(vNormal, directionalLights[0].direction);
          vec4 texelColorNight = texture2D( nightMap, vUv );
          texelColorNight = mapTexelToLinear( texelColorNight );

          outgoingLight = mix(
            vec3(texelColorNight) + ambientLightColor,
            outgoingLight,
            easeInOutExpo(dotL*0.5+0.5)
          );
      #endif
      `
    );
  }
}
