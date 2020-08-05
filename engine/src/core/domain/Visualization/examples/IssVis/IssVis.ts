import * as THREE from "three";
import Visualization from "../../models/Visualization";
import { TrackballCamera } from "@/GeoVisEngine";
import EarthVis from "../EarthVis/EarthVis";
import { MeshBasicMaterial } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import _ from "lodash";
import IssVisControls from "./IssVisControls.vue";
import iss from "@/assets/models/isscombined.obj";

import SatelliteObject from "./SatelliteObject";
import Range from "@/core/domain/GeoPosition/models/Range";

export default class IssVis extends Visualization {
  readonly r = 6371;
  public camera: TrackballCamera | null = null;
  private issObject: SatelliteObject | null = null;

  constructor() {
    super();
    this.addParent(new EarthVis());
    Object.seal(this);
  }

  setupCamera(camera: TrackballCamera) {
    this.camera = camera;
    this.camera.setZoomBounds(new Range(200, 30000));
  }

  setupScene(scene: THREE.Scene, group: THREE.Group) {
    new OBJLoader().load(iss, (obj) => {
      obj.matrixAutoUpdate = false;
      obj.renderOrder = 51;
      const material = new MeshBasicMaterial();
      obj.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });

      this.issObject = new SatelliteObject(
        [
          "BREEZE-M DEB [TANK]",
          "1 45988U 20053D   20217.66460264 -.00000000  00000-0  00000-0 0  9991",
          "2 45988  49.5157 277.0214 6272791 181.7417 174.1906  3.52888681   246",
        ],
        /*  [
          "ISS",
          "1 25544U 98067A   20217.53428063  .00001835  00000-0  41226-4 0  9999",
          "2 25544  51.6454 109.1816 0000858   6.3737  55.4466 15.49142748239515",
        ], */
        this.r,
        obj,
        new THREE.Matrix4().makeRotationX(Math.PI),
        2
      );

      this.issObject.addTo(group);
    });
  }

  update() {
    this.issObject?.update();
  }

  destroy() {
    //
  }
  getControls() {
    return IssVisControls;
  }
}
