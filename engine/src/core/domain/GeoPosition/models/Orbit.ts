import * as THREE from "three";
import Range from "./Range";
import GeoPosition from "./GeoPosition";
import GeoPosMapper from "../services/GeoPosMapper";
import { TrackballMode } from "../../Camera/enums/TrackballMode";
import NumUtils from "../../Utils/NumUtils";
import { Vector3 } from "three";

export default class Orbit {
  constructor(
    public v: THREE.Vector3,
    public calcOrigin: THREE.Vector3,
    public bounds: Range<GeoPosition> = new Range<GeoPosition>(
      GeoPosition.fromDeg(-180, -90),
      GeoPosition.fromDeg(180, 90)
    ),
    public slowFactor: number = 1,
    public up: THREE.Vector3 = Orbit.calcUp(v)
  ) {}

  static calcUp(v: THREE.Vector3) {
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      v.clone().normalize()
    );
    return new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  }

  getGeoPosition() {
    return GeoPosMapper.fromOrbit(this.v, this.up, this.calcOrigin);
  }

  setGeoPosition(position: GeoPosition) {
    const rotation = GeoPosMapper.toRotationMatrix(position);
    const v = new THREE.Vector3(0, 0, this.v.length());
    this.v = v.applyMatrix4(rotation);
    this.up = Orbit.calcUp(this.v);
    return this;
  }

  getRadius() {
    return this.v.length();
  }

  setRadius(radius: number) {
    this.v.setLength(radius);
    return this;
  }

  clone() {
    return new Orbit(this.v.clone(), this.up.clone(), this.bounds);
  }

  correctToBounds(mode: TrackballMode) {
    const qCorrect = new THREE.Quaternion();

    const coords = this.getGeoPosition();
    const latAxis = this.up.clone();
    const longAxis = new THREE.Vector3(0, 0, 1).cross(this.up).normalize();

    const b = this.bounds;

    qCorrect.multiply(
      this.boundAxisQ(coords.lat, b.from.lat, b.to.lat, latAxis)
    );
    qCorrect.multiply(
      this.boundAxisQ(coords.long, b.from.long, b.to.long, longAxis)
    );

    if (mode === TrackballMode.Compass) {
      qCorrect.multiply(
        new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0).projectOnPlane(longAxis).normalize(),
          new THREE.Vector3(0, 1, 0)
        )
      );
    }
    console.log(coords, b);

    this.applyQuaternion(qCorrect);
  }

  private boundAxisQ(
    angle: number,
    from: number,
    to: number,
    axis: THREE.Vector3
  ) {
    if (!NumUtils.inCycleRange(angle, from, to)) {
      const angleC = NumUtils.getClosest([from, to], angle);
      return new THREE.Quaternion().setFromAxisAngle(axis, angle - angleC);
    } else return new THREE.Quaternion();
  }

  applyQuaternion(q: THREE.Quaternion) {
    this.v.applyQuaternion(q);
    this.up.applyQuaternion(q);
    return this;
  }
}
