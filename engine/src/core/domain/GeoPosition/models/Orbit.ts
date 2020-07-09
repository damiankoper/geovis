import * as THREE from "three";
import Range from "./Range";
import GeoPosition from "./GeoPosition";
import GeoPosMapper from "../services/GeoPosMapper";
import { TrackballMode } from "../../Camera/enums/TrackballMode";
import NumUtils from "../../Utils/NumUtils";
import { Vector3 } from "three";

export default abstract class Orbit {
  protected compassNorth = new THREE.Vector3(0, 1, 0);

  constructor(
    public v: THREE.Vector3,
    public bounds: Range<GeoPosition> = new Range<GeoPosition>(
      GeoPosition.fromDeg(-90, -180),
      GeoPosition.fromDeg(90, 180)
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

  protected abstract getLatPlane(): THREE.Vector3;
  protected abstract getLatV(): THREE.Vector3;
  protected abstract getLatVP(): THREE.Vector3;
  protected abstract getLongPlane(): THREE.Vector3;
  protected abstract getLongOrigin(): THREE.Vector3;
  abstract clone(): Orbit;

  copy(orbit: Orbit) {
    this.v.copy(orbit.v);
    this.up.copy(orbit.up);
    this.bounds = orbit.bounds;
    this.slowFactor = orbit.slowFactor;
  }

  getGeoPosition() {
    //Longitude
    const longPlane = this.getLongPlane();
    const v1Long = this.v.clone().projectOnPlane(longPlane).normalize();
    const v2Long = this.getLongOrigin().projectOnPlane(longPlane).normalize();
    const qLong = new THREE.Quaternion().setFromUnitVectors(v1Long, v2Long);
    const dot = new Vector3(qLong.x, qLong.y, qLong.z).dot(longPlane);
    const longitude = qLong.angleTo(new THREE.Quaternion()) * Math.sign(dot);
    // Latitude
    const latPlane = this.getLatPlane();
    const v1Lat = this.getLatV().projectOnPlane(latPlane).normalize();
    const v2Lat = this.getLatV();
    const qLat = new THREE.Quaternion().setFromUnitVectors(v1Lat, v2Lat);
    const latitude =
      new THREE.Quaternion().angleTo(qLat) * Math.sign(latPlane.dot(v2Lat));
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

  correctToBounds(mode: TrackballMode) {
    const qCorrect = new THREE.Quaternion();
    const coords = this.getGeoPosition();
    const latAxis = this.getLatVP().cross(this.getLatV()).normalize();
    const longAxis = this.getLongPlane();

    const latFlip = this.getLatPlane().dot(this.getLatVP());
    if (latFlip < 0) {
      const latFlipCorrect = Math.PI / 2 - coords.lat;
      this.applyQuaternion(
        new THREE.Quaternion().setFromAxisAngle(latAxis, latFlipCorrect)
      );
    }

    const b = this.bounds;
    qCorrect.multiply(
      this.boundAxisQ(coords.long, b.from.long, b.to.long, longAxis)
    );
    qCorrect.multiply(
      this.boundAxisQ(coords.lat, b.from.lat, b.to.lat, latAxis)
    );

    if (mode === TrackballMode.Compass) {
      qCorrect.multiply(
        new THREE.Quaternion().setFromUnitVectors(
          this.compassNorth.clone().projectOnPlane(latAxis).normalize(),
          this.compassNorth
        )
      );
    }
    this.applyQuaternion(qCorrect);
  }

  latchCompassNorth(plane: THREE.Vector3) {
    this.compassNorth.copy(this.up).projectOnPlane(plane).normalize();
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

  getVectorPointingAt(pos: GeoPosition) {
    return this.v
      .clone()
      .normalize()
      .applyQuaternion(
        new THREE.Quaternion().setFromAxisAngle(
          new Vector3().crossVectors(this.v, this.up).normalize(),
          pos.lat
        )
      )
      .applyQuaternion(
        new THREE.Quaternion().setFromAxisAngle(this.up, pos.long)
      );
  }

  applyQuaternion(q: THREE.Quaternion) {
    this.v.applyQuaternion(q);
    this.up.applyQuaternion(q);
    return this;
  }
}
