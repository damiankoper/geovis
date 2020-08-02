import Vue from "vue";
import * as THREE from "three";
import Visualization from "../../models/Visualization";
import { TrackballCamera } from "@/GeoVisEngine";
import EarthVis from "../EarthVis/EarthVis";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import { Matrix4, ArrowHelper } from "three";
import moment from "moment";
import GeoPosMapper from "@/core/domain/GeoPosition/services/GeoPosMapper";
import _ from "lodash";
export default class IssVis extends Visualization {
  readonly r = 6371;
  private camera: TrackballCamera | null = null;
  private issMesh: THREE.Mesh | null = null;
  private orbit: THREE.Line | null = null;
  orbitTransformMatrix = new THREE.Matrix4()
    .makeRotationY(THREE.MathUtils.degToRad(-90))
    .multiply(
      new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(51.64))
    );

  constructor() {
    super();
    this.addParent(new EarthVis());
    Object.seal(this);
  }
  setupCamera(camera: TrackballCamera) {
    this.camera = camera;
  }
  setupScene(scene: THREE.Scene, group: THREE.Group) {
    //Orbit
    const orbitCurve = new THREE.EllipseCurve(
      0,
      0,
      this.r + 408,
      this.r + 410,
      0,
      Math.PI * 2,
      false,
      0
    );
    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(
      orbitCurve.getPoints(100)
    );
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    // Create the final object to add to the scene
    this.orbit = new THREE.Line(orbitGeometry, material);
    this.orbit.matrixAutoUpdate = false;
    this.orbit.matrix = this.orbitTransformMatrix;

    group.add(this.orbit);

    const issGrometry = new THREE.SphereGeometry(100, 30, 30).rotateX(
      Math.PI / 2
    );
    this.issMesh = new THREE.Mesh(
      issGrometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.issMesh.matrixAutoUpdate = false;
    this.issMesh.renderOrder = 51;
    group.add(this.issMesh);
  }

  updateIssThrottled = _.throttle(this.updateIss.bind(this), 1500);
  updateIss() {
    fetch("http://api.open-notify.org/iss-now.json")
      .then((res) => res.json())
      .then((data) => {
        const camera = this.camera;
        if (camera && this.issMesh) {
          const fromCenter = 410 + this.r;
          this.issMesh.matrix = GeoPosMapper.toRotationMatrix(
            new GeoPosition(
              THREE.MathUtils.degToRad(data.iss_position.latitude),
              THREE.MathUtils.degToRad(data.iss_position.longitude)
            )
          ).multiply(new Matrix4().makeTranslation(0, 0, fromCenter));
          this.issMesh.updateMatrixWorld();
        }
      });
  }

  update() {
    this.updateIssThrottled();
  }
  destroy() {
    //
  }
  getControls(): Vue {
    return new Vue();
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
}
