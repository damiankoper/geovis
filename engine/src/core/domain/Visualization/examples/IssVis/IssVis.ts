import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import { TrackballCamera } from "../../../../../GeoVisEngine";
import { TrackballMode } from "../../../../../core/domain/Camera/enums/TrackballMode";

import Range from "../../../../../core/domain/Utils/Range";
import EarthVis from "../../../../../core/domain/Visualization/examples/EarthVis/EarthVis";
import IssVisControls from "./IssVisControls.vue";

import Visualization from "../../../../../core/domain/Visualization/models/Visualization";
import VisualizationMeta from "../../../../../core/domain/Visualization/models/VisualizationMeta";

import SatelliteObject from "../../../../../core/domain/Visualization/examples/EarthCommon/SatelliteObject";
import TLEService from "../../../../../core/domain/Visualization/examples/EarthCommon/TLEService";

import iss from "../../../../../core/domain/Visualization/examples/IssVis/assets/models/isscombined.obj";
import hst from "../../../../../core/domain/Visualization/examples/IssVis/assets/models/hst.obj";

import thumbnail from "!!base64-image-loader!./assets/thumbnail.jpg";

/**
 * @category VisualizationExamples
 */
export default class IssVis extends Visualization {
  readonly r = 6371;
  public camera: TrackballCamera | null = null;
  public group: THREE.Group | null = null;

  private satelliteMaterial = new THREE.MeshBasicMaterial();

  issObject: SatelliteObject | null = null;
  hstObject: SatelliteObject | null = null;
  hotbird13EObject: SatelliteObject | null = null;

  private tleService = new TLEService();

  constructor() {
    super();
    this.addParent(new EarthVis());
    Object.seal(this);
  }

  setupCamera(camera: TrackballCamera) {
    this.camera = camera;
    this.camera
      .setZoomBounds(new Range(200, 30000))
      .setMode(TrackballMode.Free);
  }

  async setupScene(scene: THREE.Scene, group: THREE.Group) {
    this.group = group;
    const tleData = await this.tleService.update();

    // ISS
    this.issObject = new SatelliteObject(
      tleData[25544],
      this.r,
      await this.loadSatelliteModel(iss),
      new THREE.Matrix4()
        .makeScale(4, 4, 4)
        .multiply(new THREE.Matrix4().makeRotationX(Math.PI))
    );
    this.issObject.addTo(group);

    // HUBBLE
    this.hstObject = new SatelliteObject(
      tleData[20580],
      this.r,
      await this.loadSatelliteModel(hst),
      new THREE.Matrix4().makeScale(0.25, 0.25, 0.25)
    );
    this.hstObject.addTo(group);

    // HOTBIRD
    const sphereHB = new THREE.Mesh(
      new THREE.SphereBufferGeometry(1000, 20, 10),
      this.satelliteMaterial
    );
    sphereHB.matrixAutoUpdate = false;
    sphereHB.renderOrder = 51;
    this.hotbird13EObject = new SatelliteObject(
      tleData[33459],
      this.r,
      sphereHB,
      new THREE.Matrix4().makeScale(0.25, 0.25, 0.25)
    );
    this.hotbird13EObject.addTo(group);
  }

  loadSatelliteModel(path: string) {
    const m = this.satelliteMaterial;
    return new Promise<THREE.Object3D>((resolve) => {
      new OBJLoader().load(path, (obj) => {
        obj.matrixAutoUpdate = false;
        obj.renderOrder = 51;
        obj.traverse(function (child) {
          if (child instanceof THREE.Mesh) {
            child.material = m;
          }
          resolve(obj);
        });
      });
    });
  }

  update() {
    const globalOrbit = this.camera?.getGlobalOrbit();
    const localOrbit = this.camera?.getLocalOrbit();
    if (globalOrbit && localOrbit && this.group) {
      const q = new THREE.Quaternion()
        .setFromRotationMatrix(this.group.matrix)
        .conjugate();
      const t = new THREE.Matrix4().makeTranslation(
        0,
        0,
        globalOrbit.getRadius()
      );
      const camInGroupPos = localOrbit.v
        .clone()
        .applyMatrix4(t)
        .applyQuaternion(q);
      this.hotbird13EObject?.update(undefined, camInGroupPos);
      this.hstObject?.update(undefined, camInGroupPos);
      this.issObject?.update(undefined, camInGroupPos);
    }
  }

  destroy() {
    this.satelliteMaterial.dispose();
  }

  getControls() {
    return IssVisControls;
  }

  setupOwnMeta(meta: VisualizationMeta) {
    meta.setTitle("Satellites");
    meta.setAuthor("Damian Koper");
    meta.setDescription(
      `Shows position relative to earth of arbitrary chosen three satellites - ISS, Hubble Space Telescope and HotBird 13C.
Position is calculated using TLE records.`
    );
    meta.addKeywords(["stars", "milkyway"]);
    meta.setThumbnail(thumbnail);
  }
}
