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
import SphereVisControls from "./SphereVisControls.vue";
import AtmosphereVis from "../AtmosphereVis/AtmosphereVis";
import {
  MaterialParameters,
  MeshPhongMaterialParameters,
  Quaternion,
  Vector3,
  Mesh,
} from "three";
import { TrackballMode } from "@/core/domain/Camera/enums/TrackballMode";
/**
 * @category VisualizationExamples
 */
export default class SphereVis extends Visualization {
  camera?: TrackballCamera;
  mesh?: Mesh;
  cloudMesh?: Mesh;

  constructor() {
    super();
    this.addParent(new StarsVis());
    this.addParent(new AtmosphereVis());
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      .setMode(TrackballMode.Compass)
      .setZoomBounds(new Range(10, 20000))
      .setGlobalOrbitBounds(
        new Range(GeoPosition.fromDeg(-85, -180), GeoPosition.fromDeg(85, 180))
      );
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    const r = 6371;

    const sphere = new THREE.SphereGeometry(r, 200, 200);
    sphere.rotateY(-Math.PI / 2);
    const sphereMaterial = new THREE.MeshPhongMaterial({
      map: new THREE.TextureLoader().load(earthMap),
      specularMap: new THREE.TextureLoader().load(earthSpecularMap),
      normalMap: new THREE.TextureLoader().load(earthNormalMap),
      shininess: 100,
    });
    sphereMaterial.onBeforeCompile = (shader) => {
      shader.uniforms.nightMap = {
        value: new THREE.TextureLoader().load(earthNightMap),
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
    };

    this.mesh = new THREE.Mesh(sphere, sphereMaterial);
    this.mesh.renderOrder = 11;
    group.add(this.mesh);

    const sphereClouds = new THREE.SphereGeometry(r + 4, 100, 100);
    sphereClouds.rotateY(-Math.PI / 2);
    const sphereCloudsMaterial = new THREE.MeshPhongMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      map: new THREE.TextureLoader().load(earthCloudsMap),
    });
    this.cloudMesh = new THREE.Mesh(sphereClouds, sphereCloudsMaterial);
    this.cloudMesh.renderOrder = 10;
    group.add(this.cloudMesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.01);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    group.add(directionalLight);
    directionalLight.position.set(
      0,
      0,
      10000
    ) /*
      .applyAxisAngle(new Vector3(1, 0, 0), THREE.MathUtils.degToRad(23.4393)) */;
    group.add(directionalLight.target);
  }

  update(deltaFactor: number): void {
    /*    console.log(deltaFactor);

    const q1 = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      -0.009 * deltaFactor
    );
        const q2 = new Quaternion().setFromAxisAngle(
      new Vector3(0, 1, 0),
      0.01 * deltaFactor
    );
    this.mesh?.applyQuaternion(q1);
    this.cloudMesh?.applyQuaternion(q1);
    //this.camera?.getGlobalOrbit().applyQuaternion(q2);
    this.camera?.refreshGlobalOrbit(); */
  }

  destroy(): void {
    console.info("destroy");
  }

  getControls() {
    return SphereVisControls;
  }
}
