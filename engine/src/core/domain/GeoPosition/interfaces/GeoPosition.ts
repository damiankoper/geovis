import * as THREE from "three";
export default class GeoPosition {
  constructor(public lat: number, public long: number) {}

  get latDeg() {
    return THREE.MathUtils.radToDeg(this.lat);
  }
  get longDeg() {
    return THREE.MathUtils.radToDeg(this.long);
  }

  static fromRad(lat: number, long: number) {
    return new GeoPosition(lat, long);
  }
  static fromDeg(lat: number, long: number) {
    return new GeoPosition(
      THREE.MathUtils.degToRad(lat),
      THREE.MathUtils.degToRad(long)
    );
  }
}
