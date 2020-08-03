import Vue from "vue";
import * as THREE from "three";
import Visualization from "../../models/Visualization";
import { TrackballCamera } from "@/GeoVisEngine";
import EarthVis from "../EarthVis/EarthVis";
import GeoPosition from "@/core/domain/GeoPosition/models/GeoPosition";
import {
  Matrix4,
  ArrowHelper,
  AxesHelper,
  Vector3,
  Euler,
  MeshBasicMaterial,
} from "three";
import moment from "moment";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

import GeoPosMapper from "@/core/domain/GeoPosition/services/GeoPosMapper";
import _ from "lodash";
import TimeService from "../EarthVis/TimeService";
import iss from "@/assets/models/isscombined.obj";
export default class IssVis extends Visualization {
  readonly r = 6371;
  private camera: TrackballCamera | null = null;
  private issMesh: THREE.Mesh | null = null;
  private issObject: THREE.Object3D | null = null;
  private issGround: THREE.Line | null = null;
  private orbit: THREE.Line | null = null;

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
      orbitCurve.getPoints(300)
    );
    const material = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 5,
      opacity: 0.7,
      transparent: true,
    });
    this.orbit = new THREE.Line(orbitGeometry, material);
    this.orbit.matrixAutoUpdate = false;
    group.add(this.orbit);

    const materialGround = new THREE.LineBasicMaterial({
      color: 0xffffff,
      linewidth: 1,
      opacity: 0.2,
      transparent: true,
    });
    const issLineGround = new THREE.LineCurve3(
      new THREE.Vector3(),
      new THREE.Vector3(0, 0, this.r / 2)
    );
    this.issGround = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(issLineGround.getPoints()),
      materialGround
    );
    this.issGround.matrixAutoUpdate = false;
    group.add(this.issGround);

    new OBJLoader().load(iss, (obj) => {
      this.issObject = obj;
      obj.matrixAutoUpdate = false;
      obj.renderOrder = 51;
      const material = new MeshBasicMaterial();
      obj.traverse(function (child) {
        if (child instanceof THREE.Mesh) {
          child.material = material;
        }
      });
      group.add(obj);
    });

    const issGrometry = new THREE.SphereGeometry(100, 30, 30);
    this.issMesh = new THREE.Mesh(
      issGrometry,
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    this.issMesh.matrixAutoUpdate = false;
    this.issMesh.renderOrder = 51;
    //group.add(this.issMesh);
  }

  updateIssThrottled = _.throttle(this.updateIss.bind(this), 1500);
  updateIss() {
    fetch("http://api.open-notify.org/iss-now.json")
      .then((res) => res.json())
      .then((data) => {
        const camera = this.camera;
        if (camera && this.issMesh && this.issObject && this.issGround) {
          const fromCenter = 410 + this.r;
          this.issMesh.matrix = GeoPosMapper.toRotationMatrix(
            new GeoPosition(
              THREE.MathUtils.degToRad(data.iss_position.latitude),
              THREE.MathUtils.degToRad(data.iss_position.longitude)
            )
          ).multiply(new Matrix4().makeTranslation(0, 0, fromCenter));

          this.issObject.matrix = this.issMesh.matrix
            .clone()
            .multiply(new THREE.Matrix4().makeScale(10, 10, 10))
            .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2));

          this.issGround.matrix = GeoPosMapper.toRotationMatrix(
            new GeoPosition(
              THREE.MathUtils.degToRad(data.iss_position.latitude),
              THREE.MathUtils.degToRad(data.iss_position.longitude)
            )
          ).multiply(new Matrix4().makeTranslation(0, 0, this.r / 2 + 410));
        }
      });
  }

  update() {
    this.updateIssThrottled();

    if (this.orbit)
      this.orbit.matrix = new THREE.Matrix4()
        .makeRotationY(
          this.getFirstPointOfAriesAngle() +
            THREE.MathUtils.degToRad(114.0295) +
            -TimeService.getHourAngle()
        )
        .multiply(
          new THREE.Matrix4().makeRotationX(
            THREE.MathUtils.degToRad(90 - 51.6444)
          )
        );
  }

  getFirstPointOfAriesAngle() {
    const dayOfYearFrac =
      moment().dayOfYear() +
      moment.utc().diff(moment.utc().startOf("day"), "ms") / 3600000 / 24;
    const correction = THREE.MathUtils.degToRad(180);
    return (2 * Math.PI * (dayOfYearFrac - 80)) / 365 + correction;
  }

  destroy() {
    //
  }
  getControls(): Vue {
    return new Vue();
  }
}
