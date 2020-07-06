import Visualization from "../models/Visualization";
import * as THREE from "three";
import { Matrix4, Mapping } from "three";
import TrackballCamera from "../../Camera/interfaces/TrackballCamera";
import Range from "../../GeoPosition/models/Range";
import GeoPosition from "../../GeoPosition/models/GeoPosition";
import earthMap from "@/assets/textures/2.png";
import earthNormalMap from "@/assets/textures/8k_earth_normal_map.jpg";
import earthSpecularMap from "@/assets/textures/8k_earth_specular_map.jpg";
import StarsVis from "./StarsVis";
import SphereVisControls from "./SphereVisControls.vue";
/**
 * @category VisualizationExamples
 */
export default class SphereVis extends Visualization {
  camera?: TrackballCamera;
  constructor() {
    super();
    this.addParent(new StarsVis());
  }

  setupCamera(camera: TrackballCamera): void {
    this.camera = camera;
    camera
      //.setMode(TrackballMode.Compass)
      .setZoomBounds(new Range(0.001, 20000))
      .setGlobalOrbitBounds(
        new Range(GeoPosition.fromDeg(-85, -180), GeoPosition.fromDeg(85, 180))
      );
  }

  tile2lat(y: number, z: number) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }

  setupScene(scene: THREE.Scene, group: THREE.Group): void {
    const r = 6371;
    const zoom = 4;
    const zoomPlus = Math.pow(2, zoom);
    const thetaShift = THREE.MathUtils.degToRad(90 - 85.0511);
    for (let phi = 0; phi < zoomPlus; phi++) {
      for (let theta = 0; theta < zoomPlus; theta++) {
        const thetaStart =
          THREE.MathUtils.degToRad(85.0511) -
          this.tile2lat(theta, zoom) +
          thetaShift;
        const thetaLength =
          THREE.MathUtils.degToRad(85.0511) -
          this.tile2lat(theta + 1, zoom) -
          thetaStart +
          thetaShift;
        const phiStep = (Math.PI * 2) / zoomPlus;
        const phiStart = phiStep * phi;
        const phiLength = (2 * Math.PI) / zoomPlus;

        const sphere = new THREE.SphereGeometry(
          r,
          10,
          10,
          phiStart,
          phiLength,
          thetaStart,
          thetaLength
        );
        sphere.rotateY(-Math.PI / 2);
        const sphereMaterial = new THREE.MeshPhongMaterial();
        sphereMaterial.map = new THREE.TextureLoader().load(
          `https://tile.openstreetmap.org/${zoom}/${phi}/${theta}.png`
        );
        sphereMaterial.shininess = 10;
        //sphereMaterial.color = new THREE.Color(0x333333);
        const sphereMesh = new THREE.Mesh(sphere, sphereMaterial);
        sphereMesh.matrixAutoUpdate = false;
        group.add(sphereMesh);
      }
    }
    const testBoxes = [
      new THREE.BoxBufferGeometry(0.001, 0.001, 0.001),
      new THREE.BoxBufferGeometry(0.01, 0.01, 0.01),
      new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
      new THREE.BoxBufferGeometry(1, 1, 1),
      new THREE.BoxBufferGeometry(10, 10, 10),
      new THREE.BoxBufferGeometry(100, 100, 100),
    ];

    const boxGroup = new THREE.Group();
    boxGroup.applyMatrix4(new Matrix4().makeTranslation(0, r, 0));
    boxGroup.applyMatrix4(new Matrix4().makeRotationX(Math.PI / 2));

    const boxMaterial = new THREE.MeshPhongMaterial({ color: 0x5500ff });
    testBoxes.forEach((box, i) => {
      box.applyMatrix4(new Matrix4().makeTranslation(0, 0, -(10 ** (i - 3))));
      const boxMesh = new THREE.Mesh(box, boxMaterial);
      boxGroup.add(boxMesh);
    });
    group.add(boxGroup);

    const axesHelper = new THREE.AxesHelper(1.25 * r);
    group.add(axesHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7);
    scene.add(directionalLight);
    directionalLight.position.set(0, 0, 1);

    scene.add(new THREE.AxesHelper(9000));
  }

  update(deltaFactor: number): void {
    //
  }

  destroy(): void {
    console.info("destroy");
  }

  getControls() {
    return SphereVisControls;
  }
}
