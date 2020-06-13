import * as THREE from "three";
import Range from "./Range";
import GeoPosition from "./GeoPosition";
import GeoPosMapper from "../services/GeoPosMapper";
import { TrackballMode } from "../../Camera/enums/TrackballMode";
import NumUtils from "../../Utils/NumUtils";
import { Vector3 } from "three";

export default abstract class Orbit {
  constructor(
    public v: THREE.Vector3,
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

  protected abstract getLongPlane(): THREE.Vector3;
  protected abstract getLongV(): THREE.Vector3;
  protected abstract getLongVP(): THREE.Vector3;
  protected abstract getLatPlane(): THREE.Vector3;
  protected abstract getLatOrigin(): THREE.Vector3;

  getGeoPosition() {
    //Latitude
    const latPlane = this.getLatPlane();
    const v1Lat = this.v.clone().projectOnPlane(latPlane).normalize();
    const v2Lat = this.getLatOrigin().projectOnPlane(latPlane).normalize();
    const qLat = new THREE.Quaternion().setFromUnitVectors(v1Lat, v2Lat);
    const dot = new Vector3(qLat.x, qLat.y, qLat.z).dot(latPlane);
    const latitude = qLat.angleTo(new THREE.Quaternion()) * Math.sign(dot);
    // Longitude
    const longPlane = this.getLongPlane();
    const v1Long = this.getLongV().projectOnPlane(longPlane).normalize();
    const v2Long = this.getLongV();
    const qLong = new THREE.Quaternion().setFromUnitVectors(v1Long, v2Long);
    const longitude =
      new THREE.Quaternion().angleTo(qLong) * Math.sign(longPlane.dot(v2Long));
    return new GeoPosition(latitude, longitude);
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
    return new Orbit(this.v.clone(), this.bounds);
  }

  correctToBounds(mode: TrackballMode) {
    const qCorrect = new THREE.Quaternion();

    const coords = this.getGeoPosition();
    const latAxis = this.getLatPlane();
    const longAxis = this.getLongVP().cross(this.getLongV()).normalize();
    const b = this.bounds;

    const longFlip = this.getLongPlane().dot(this.getLongVP());
    if (longFlip < 0) {
      const lontFlipCorrect = Math.PI / 2 - coords.long;
      this.applyQuaternion(
        new THREE.Quaternion().setFromAxisAngle(longAxis, lontFlipCorrect)
      );
    }

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

    this.applyQuaternion(qCorrect);
  }

  protected boundAxisQ(
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
