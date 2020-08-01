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
  orbitTransformMatrix = new THREE.Matrix4()
    .makeRotationY(THREE.MathUtils.degToRad(-121.6846))
    .multiply(
      new THREE.Matrix4().makeRotationX(THREE.MathUtils.degToRad(51.64))
    );

  private go = new ArrowHelper(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, 0, -this.r),
    9000
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
    const orbit = new THREE.Line(orbitGeometry, material);
    orbit.matrixAutoUpdate = false;
    orbit.matrix = this.orbitTransformMatrix;

    group.add(orbit);

    const issGrometry = new THREE.SphereGeometry(100, 30, 30).rotateX(
      Math.PI / 2
    );
    this.issMesh = new THREE.Mesh(issGrometry, new THREE.MeshBasicMaterial());
    this.issMesh.matrixAutoUpdate = false;

    scene.add(this.go);

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
    if (this.camera) {
      this.go.setDirection(this.camera.getGlobalOrbit().v.clone().normalize());
    }
  }
  destroy() {
    //
  }
  getControls(): Vue {
    return new Vue();
  }
}
