import * as THREE from "three";
import moment from "moment";

import Visualization from "../../../../../core/domain/Visualization/models/Visualization";
import VisualizationMeta from "../../models/VisualizationMeta";
import TrackballCamera from "../../../../../core/domain/Camera/interfaces/TrackballCamera";
import { TrackballMode } from "../../../../../core/domain/Camera/enums/TrackballMode";

import Range from "../../../../../core/domain/Utils/Range";
import GeoPosition from "../../../../../core/domain/GeoPosition/models/GeoPosition";
import StarsVis from "../../../../../core/domain/Visualization/examples/StarsVis/StarsVis";
import EarthVisControls from "./EarthVisControls.vue";
import AtmosphereVis from "../AtmosphereVis/AtmosphereVis";
import TimeService from "./TimeService";

import earthMap from "../../../../../core/domain/Visualization/examples/EarthVis/assets/textures/8k_earth_daymap.jpg";
import earthNightMap from "../../../../../core/domain/Visualization/examples/EarthVis/assets/textures/8k_earth_nightmap.jpg";
import earthNormalMap from "../../../../../core/domain/Visualization/examples/EarthVis/assets/textures/8k_earth_normal_map.jpg";
import earthSpecularMap from "../../../../../core/domain/Visualization/examples/EarthVis/assets/textures/8k_earth_specular_map.jpg";
import earthCloudsMap from "../../../../../core/domain/Visualization/examples/EarthVis/assets/textures/8k_earth_clouds.jpg";

import thumbnail from "!!base64-image-loader!./assets/thumbnail.jpg";

/**
 * @category VisualizationExamples
 */
export default class EarthVis extends Visualization {
  readonly r = 6371;
  camera: TrackballCamera | null = null;
  private earthGroup = new THREE.Group().rotateY(-Math.PI / 2);
  private nightMap: THREE.Texture = new THREE.TextureLoader().load(
    earthNightMap
  );
  private sphere = new THREE.SphereGeometry(this.r, 200, 100);
  private sphereMaterial = new THREE.MeshPhongMaterial({
    map: new THREE.TextureLoader().load(earthMap),
    specularMap: new THREE.TextureLoader().load(earthSpecularMap),
    normalMap: new THREE.TextureLoader().load(earthNormalMap),
    shininess: 100,
  });
  private sphereClouds = new THREE.SphereGeometry(this.r + 4, 200, 100);
  private sphereCloudsMaterial = new THREE.MeshPhongMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    map: new THREE.TextureLoader().load(earthCloudsMap),
  });
  private directionalLight = new THREE.DirectionalLight(0xffffff, 1);

  constructor(public timestamp = moment.utc()) {
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
    scene.add(ambientLight);

    group.add(this.directionalLight);
    group.add(this.directionalLight.target);

    const mesh = new THREE.Mesh(this.sphere, this.sphereMaterial);
    const cloudMesh = new THREE.Mesh(
      this.sphereClouds,
      this.sphereCloudsMaterial
    );
    this.earthGroup.add(mesh);
    this.earthGroup.add(cloudMesh);

    group.add(this.earthGroup);
  }

  update(deltaFactor: number): void {
    this.directionalLight.position
      .set(0, 0, 10000)
      .applyAxisAngle(
        new THREE.Vector3(1, 0, 0),
        TimeService.getSunDeclination(this.timestamp)
      )
      .applyAxisAngle(
        new THREE.Vector3(0, -1, 0),
        TimeService.getHourAngle(undefined, undefined, this.timestamp)
      );
  }

  destroy(): void {
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

  setupOwnMeta(meta: VisualizationMeta) {
    meta.setTitle("Earth");
    meta.setDescription("Earth illuminated by the sun at the current time.");
    meta.addKeywords(["earth"]);
    meta.setAuthor("Damian Koper");
    meta.setThumbnail(thumbnail);
  }
}
